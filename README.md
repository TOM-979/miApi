# miApi — Backend de Inventario

API REST del **Panel Administrativo de Inventario** (Laboratorio #9), construida
sobre el backend de los Laboratorios #7 y #8. Gestiona categorías, proveedores,
usuarios, productos y un **kardex de movimientos** con control de stock
transaccional, además de un endpoint de dashboard con métricas del inventario.

La consume el frontend **AppInventario** (React).

## Tecnologías

| Tecnología | Uso |
|---|---|
| Node.js + Express 5 | Servidor HTTP y enrutamiento |
| Sequelize 6 | ORM y sincronización de tablas |
| MySQL (XAMPP) | Base de datos |
| mysql2 | Driver de MySQL |
| bcryptjs | Hash de contraseñas |
| cors | Peticiones desde el frontend React |
| dotenv | Variables de entorno |
| nodemon | Recarga automática en desarrollo |

## Requisitos

- **XAMPP** con el módulo **MySQL** iniciado.
- **Node.js 18 o superior**.
- Una base de datos creada en MySQL (por ejemplo `APPINVENTARIO`), desde
  phpMyAdmin o con `CREATE DATABASE APPINVENTARIO;`.

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar la plantilla de variables de entorno y editarla
copy .env.example .env      # en Linux/Mac: cp .env.example .env

# 3. Cargar datos de prueba (BORRA y recrea las tablas)
npm run seed

# 4. Levantar el servidor en modo desarrollo
npm run dev
```

El servidor queda en **http://localhost:3006**. Al arrancar debe imprimir:

```
Base de datos conectada y tablas sincronizadas
Servidor corriendo en http://localhost:3006
```

Si no conecta, revisa que MySQL esté iniciado en XAMPP y que los datos de
`.env` sean correctos.

### Variables de entorno (`.env`)

```env
PORT=3006
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=nombre_de_tu_base
DB_USER=root
DB_PASS=
UMBRAL_BAJO_STOCK=5
```

`UMBRAL_BAJO_STOCK` define a partir de qué stock un producto se considera bajo
en el dashboard.

### Scripts

| Script | Qué hace |
|---|---|
| `npm start` | Arranca el servidor |
| `npm run dev` | Arranca con nodemon (recarga al guardar) |
| `npm run seed` | Recrea las tablas y carga datos de prueba |

### Usuarios de prueba (creados por el seeder)

| Email | Contraseña | Rol |
|---|---|---|
| `admin@inventario.pe` | `admin123` | Administrador |
| `almacen@inventario.pe` | `almacen123` | Almacenero |

Las contraseñas se guardan hasheadas con bcrypt y **nunca** se devuelven en las
respuestas de la API.

## Estructura del proyecto

```
miApi/
├── index.js                 arranque: authenticate, sync y listen
├── app.js                   express, cors, json, rutas, 404 y errores
├── config/db.js             conexión Sequelize
├── models/                  Categoria, Proveedor, Usuario, Producto, Movimiento
│   └── index.js             todas las asociaciones
├── controllers/             lógica de cada recurso
├── routes/                  rutas de cada recurso
├── middlewares/error.js     respuestas de error uniformes
├── seeders/seed.js          datos de prueba
├── postman/                 colección de Postman
└── docs/der.md              diagrama entidad-relación
```

## Endpoints

Todas las respuestas son JSON. Los errores siempre tienen la forma
`{ "mensaje": "..." }` en español.

### Generales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Estado de la API |
| GET | `/dashboard` | Métricas del inventario |

### Categorías

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categorias` | Lista con `productosCount` por categoría |
| GET | `/categorias/:id` | Una categoría |
| POST | `/categorias` | Crear (`nombre` obligatorio y único) |
| PUT | `/categorias/:id` | Editar |
| DELETE | `/categorias/:id` | Eliminar (409 si tiene productos) |

### Proveedores

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/proveedores` | Lista |
| GET | `/proveedores/:id` | Un proveedor |
| POST | `/proveedores` | Crear (`razon_social` obligatoria) |
| PUT | `/proveedores/:id` | Editar |
| DELETE | `/proveedores/:id` | Eliminar (409 si tiene productos) |

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/usuarios` | Lista (sin `password`) |
| GET | `/usuarios/:id` | Un usuario |
| POST | `/usuarios` | Crear (email único, rol `Administrador`/`Almacenero`) |
| PUT | `/usuarios/:id` | Editar; si `password` llega vacío no se cambia |
| DELETE | `/usuarios/:id` | Eliminar (409 si registró movimientos) |

### Productos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/productos` | Lista con `categoria` y `proveedor` anidados |
| GET | `/productos/:id` | Un producto |
| POST | `/productos` | Crear (`categoria_id` obligatorio; 400 si no existe) |
| PUT | `/productos/:id` | Editar |
| DELETE | `/productos/:id` | Eliminar (409 si tiene movimientos) |

### Movimientos (kardex)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/movimientos?producto_id=&tipo=` | Lista ordenada por `fecha_hora` DESC |
| GET | `/movimientos/:id` | Un movimiento |
| POST | `/movimientos` | Registra el movimiento y actualiza el stock (transacción) |

Cuerpo de `POST /movimientos`:

```json
{
  "producto_id": 8,
  "usuario_id": 2,
  "tipo_movimiento": "Entrada",
  "cantidad": 10,
  "observaciones": "Ingreso por compra"
}
```

### Códigos de estado

| Código | Cuándo |
|---|---|
| 200 / 201 | Operación correcta / recurso creado |
| 400 | Datos inválidos o faltantes, FK que no existe |
| 404 | El recurso no existe |
| 409 | Stock insuficiente, email o nombre repetido, borrado con registros relacionados |
| 500 | Error interno |

## La transacción de los movimientos

Registrar un movimiento implica **dos escrituras distintas**: actualizar
`Productos.stock` e insertar la fila en `Movimientos`. Si la segunda falla
después de la primera, el stock quedaría modificado sin un movimiento que lo
justifique: el inventario se descuadra y el kardex deja de cuadrar con la
existencia real.

La solución es `sequelize.transaction()`, en
[controllers/movimientoController.js](controllers/movimientoController.js).
Todo lo que ocurre dentro del callback forma **una sola operación atómica**: si
el callback termina bien, Sequelize hace `COMMIT`; si se lanza cualquier error,
hace `ROLLBACK` y no queda nada guardado.

Los cuatro pasos:

1. **Leer el producto con `lock: t.LOCK.UPDATE`.** Esto genera un
   `SELECT ... FOR UPDATE` que bloquea la fila hasta que la transacción
   termine. Sin el lock, dos peticiones simultáneas podrían leer el mismo
   stock (`10`), restar cada una `6` y guardar `4` las dos, cuando lo correcto
   sería rechazar la segunda.
2. **Calcular el nuevo stock** según el tipo:
   - `Entrada`: suma la cantidad (debe ser > 0).
   - `Salida`: resta la cantidad (debe ser > 0). Si el resultado es negativo se
     lanza `409 Stock insuficiente`.
   - `Ajuste`: suma la cantidad tal cual, que puede ser negativa (merma) pero
     nunca `0`. El stock tampoco puede quedar negativo.
3. **Actualizar `Productos.stock`** con la transacción.
4. **Insertar el `Movimiento`** guardando `stock_resultante`, la foto del stock
   después del cambio. Eso es lo que convierte la tabla en un kardex
   auditable.

Si el paso 2 rechaza la operación, el `throw` dispara el rollback y el stock
queda exactamente como estaba. Se puede comprobar así:

```bash
# Stock del producto 8 = 8
POST /movimientos  { "producto_id": 8, "tipo_movimiento": "Salida", "cantidad": 9999, "usuario_id": 2 }
# -> 409 { "mensaje": "Stock insuficiente. Stock actual: 8, solicitado: 9999" }

GET /productos/8
# -> stock sigue siendo 8, y no se creó ninguna fila en Movimientos
```

El seeder reutiliza esta misma función, así que los datos de prueba nacen con
el stock y el kardex consistentes entre sí.

## Dashboard

`GET /dashboard` devuelve:

```json
{
  "totalProductos": 10,
  "totalCategorias": 4,
  "totalProveedores": 3,
  "totalUsuarios": 2,
  "valorInventario": 86455.80,
  "unidadesEnStock": 137,
  "bajoStock": 4,
  "umbralBajoStock": 5,
  "productosBajoStock": [{ "id": 3, "nombre": "...", "stock": 3, "categoria": "Laptops" }],
  "ultimosMovimientos": [],
  "productosPorCategoria": [{ "categoria": "Laptops", "cantidad": 3 }]
}
```

`valorInventario` es la suma de `precio × stock` de todos los productos.

## Postman

Importa [postman/miApi-Lab9.postman_collection.json](postman/miApi-Lab9.postman_collection.json).
Trae la variable `{{baseUrl}}` ya apuntando a `http://localhost:3006` y 44
requests agrupados por recurso, incluyendo los casos de error: crear categoría,
crear producto con `categoria_id`, registrar una Entrada, una Salida sin stock
suficiente (muestra el `409`) y `GET /dashboard`.

## Documentación relacionada

- [Diagrama entidad-relación (DER)](docs/der.md)
- Frontend **AppInventario** (React) — consume esta API en el puerto `3006`.
