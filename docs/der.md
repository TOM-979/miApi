# DER - Panel Administrativo de Inventario (Laboratorio #9)

Base de datos MySQL con 5 tablas. `Productos` es la tabla central: cada
producto pertenece a una categoría y, opcionalmente, a un proveedor. Los
`Movimientos` forman el kardex: cada fila guarda quién movió qué, cuánto y con
qué stock quedó el producto.

```mermaid
erDiagram
    CATEGORIAS {
        int id PK
        string nombre "UNIQUE, NOT NULL"
        text descripcion
        datetime created_at
        datetime updated_at
    }

    PROVEEDORES {
        int id PK
        string razon_social "NOT NULL"
        string contacto
        string telefono
        string email
        datetime created_at
        datetime updated_at
    }

    USUARIOS {
        int id PK
        string nombre "NOT NULL"
        string email "UNIQUE, NOT NULL"
        string password "hash bcrypt, NOT NULL"
        enum rol "Administrador | Almacenero"
        datetime created_at
        datetime updated_at
    }

    PRODUCTOS {
        int id PK
        string nombre "NOT NULL"
        text descripcion
        decimal precio "DECIMAL(10,2), > 0"
        int stock "DEFAULT 0, >= 0"
        int categoria_id FK "NULL permitido en BD"
        int proveedor_id FK "opcional"
        datetime created_at
        datetime updated_at
    }

    MOVIMIENTOS {
        int id PK
        int producto_id FK "NOT NULL"
        int usuario_id FK "NOT NULL"
        enum tipo_movimiento "Entrada | Salida | Ajuste"
        int cantidad "NOT NULL"
        int stock_resultante "NOT NULL"
        datetime fecha_hora "DEFAULT NOW"
        text observaciones
        datetime created_at
        datetime updated_at
    }

    CATEGORIAS  ||--o{ PRODUCTOS   : "clasifica"
    PROVEEDORES ||--o{ PRODUCTOS   : "abastece"
    PRODUCTOS   ||--o{ MOVIMIENTOS : "registra en kardex"
    USUARIOS    ||--o{ MOVIMIENTOS : "ejecuta"
```

## Cardinalidades

| Relación | Cardinalidad | Clave foránea | Borrado |
|---|---|---|---|
| Categoría → Productos | 1 : N | `Productos.categoria_id` | `RESTRICT` |
| Proveedor → Productos | 1 : N (opcional) | `Productos.proveedor_id` | `RESTRICT` |
| Producto → Movimientos | 1 : N | `Movimientos.producto_id` | `RESTRICT` |
| Usuario → Movimientos | 1 : N | `Movimientos.usuario_id` | `RESTRICT` |

`RESTRICT` evita borrar un registro que todavía tiene hijos. La API además
comprueba las dependencias antes de borrar y responde `409` con un mensaje
explicando cuántos registros relacionados existen.

## Nota sobre `categoria_id`

La columna admite `NULL` en la base de datos porque la tabla `Productos` ya
existía desde el Laboratorio #7 con filas sin categoría. La API, en cambio, sí
exige `categoria_id` al crear o editar un producto, de modo que todo registro
nuevo queda siempre clasificado.
