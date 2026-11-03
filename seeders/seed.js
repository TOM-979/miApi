/**
 * Seeder del Laboratorio #9.
 * Borra y recrea todas las tablas (sync force: true) y carga datos de prueba.
 * Ejecutar con:  npm run seed
 */
require('dotenv').config();

const { sequelize, Categoria, Proveedor, Usuario, Producto } = require('../models');
const { registrarMovimiento } = require('../controllers/movimientoController');

async function sembrar() {
    try {
        await sequelize.authenticate();
        console.log('Conectado a MySQL. Recreando tablas...');

        // force: true elimina las tablas existentes y las vuelve a crear vacias
        await sequelize.sync({ force: true });

        // --- CATEGORIAS ---
        const categorias = await Categoria.bulkCreate([
            { nombre: 'Laptops', descripcion: 'Computadoras portatiles de trabajo y gaming' },
            { nombre: 'Perifericos', descripcion: 'Teclados, mouse y accesorios de entrada' },
            { nombre: 'Monitores', descripcion: 'Pantallas y monitores de escritorio' },
            { nombre: 'Accesorios', descripcion: 'Cables, mochilas, hubs y complementos' }
        ]);
        const [laptops, perifericos, monitores, accesorios] = categorias;
        console.log(`Categorias creadas: ${categorias.length}`);

        // --- PROVEEDORES ---
        const proveedores = await Proveedor.bulkCreate([
            {
                razon_social: 'Importaciones Hiraoka S.A.C.',
                contacto: 'Carmen Vasquez',
                telefono: '01 428 9000',
                email: 'ventas@hiraoka.com.pe'
            },
            {
                razon_social: 'Distribuidora Deltron S.A.',
                contacto: 'Luis Quispe Mamani',
                telefono: '01 613 7272',
                email: 'corporativo@deltron.com.pe'
            },
            {
                razon_social: 'Tecnologia Andina E.I.R.L.',
                contacto: 'Rosa Huaman Rojas',
                telefono: '984 512 330',
                email: 'contacto@tecandina.pe'
            }
        ]);
        const [hiraoka, deltron, andina] = proveedores;
        console.log(`Proveedores creados: ${proveedores.length}`);

        // --- USUARIOS (la password se hashea sola en el hook beforeCreate) ---
        const admin = await Usuario.create({
            nombre: 'Administrador del Sistema',
            email: 'admin@inventario.pe',
            password: 'admin123',
            rol: 'Administrador'
        });
        const almacenero = await Usuario.create({
            nombre: 'Jorge Almacen',
            email: 'almacen@inventario.pe',
            password: 'almacen123',
            rol: 'Almacenero'
        });
        console.log('Usuarios creados: 2');

        // --- PRODUCTOS (precios en soles, varios con stock bajo) ---
        const productos = await Producto.bulkCreate([
            { nombre: 'Laptop Lenovo IdeaPad 3 Ryzen 5', descripcion: '8GB RAM, 512GB SSD, 15.6"', precio: 2199.00, stock: 12, categoria_id: laptops.id, proveedor_id: hiraoka.id },
            { nombre: 'Laptop HP Victus 15 Core i5', descripcion: '16GB RAM, RTX 2050, 15.6"', precio: 3499.90, stock: 4, categoria_id: laptops.id, proveedor_id: deltron.id },
            { nombre: 'Laptop Asus Vivobook Go 14', descripcion: '8GB RAM, 256GB SSD', precio: 1599.00, stock: 3, categoria_id: laptops.id, proveedor_id: hiraoka.id },
            { nombre: 'Teclado mecanico Redragon Kumara', descripcion: 'Switch rojo, retroiluminado', precio: 149.90, stock: 25, categoria_id: perifericos.id, proveedor_id: deltron.id },
            { nombre: 'Mouse Logitech G203 Lightsync', descripcion: '8000 DPI, RGB', precio: 109.90, stock: 18, categoria_id: perifericos.id, proveedor_id: deltron.id },
            { nombre: 'Audifonos HyperX Cloud Stinger 2', descripcion: 'Gaming, microfono abatible', precio: 229.00, stock: 5, categoria_id: perifericos.id, proveedor_id: andina.id },
            { nombre: 'Monitor Samsung 24" LF24T350', descripcion: 'IPS, 75Hz, Full HD', precio: 629.00, stock: 9, categoria_id: monitores.id, proveedor_id: hiraoka.id },
            { nombre: 'Monitor LG UltraGear 27" 144Hz', descripcion: 'QHD, 1ms, IPS', precio: 1349.00, stock: 2, categoria_id: monitores.id, proveedor_id: deltron.id },
            { nombre: 'Mochila para laptop Targus 15.6"', descripcion: 'Resistente al agua', precio: 139.90, stock: 30, categoria_id: accesorios.id, proveedor_id: andina.id },
            { nombre: 'Hub USB-C 7 en 1 Anker', descripcion: 'HDMI, USB 3.0, lector SD', precio: 189.00, stock: 1, categoria_id: accesorios.id, proveedor_id: andina.id }
        ]);
        console.log(`Productos creados: ${productos.length}`);

        // --- MOVIMIENTOS ---
        // Se usan a proposito con la MISMA funcion transaccional del controlador,
        // asi el stock de los productos queda consistente con el kardex.
        const movimientos = [
            { producto_id: productos[0].id, usuario_id: almacenero.id, tipo_movimiento: 'Entrada', cantidad: 10, observaciones: 'Compra inicial a Hiraoka - Factura F001-1245' },
            { producto_id: productos[0].id, usuario_id: admin.id, tipo_movimiento: 'Salida', cantidad: 3, observaciones: 'Venta mostrador - Boleta B001-0087' },
            { producto_id: productos[3].id, usuario_id: almacenero.id, tipo_movimiento: 'Entrada', cantidad: 15, observaciones: 'Reposicion de stock Deltron' },
            { producto_id: productos[6].id, usuario_id: almacenero.id, tipo_movimiento: 'Salida', cantidad: 4, observaciones: 'Despacho a sucursal Arequipa' },
            { producto_id: productos[7].id, usuario_id: admin.id, tipo_movimiento: 'Ajuste', cantidad: -1, observaciones: 'Ajuste por unidad danada en almacen' },
            { producto_id: productos[9].id, usuario_id: almacenero.id, tipo_movimiento: 'Entrada', cantidad: 6, observaciones: 'Ingreso de pedido pendiente' }
        ];

        for (const datos of movimientos) {
            const movimiento = await registrarMovimiento(datos);
            console.log(`Movimiento ${movimiento.tipo_movimiento} de ${movimiento.cantidad} -> stock resultante: ${movimiento.stock_resultante}`);
        }

        console.log('\nSeed completado correctamente.');
        console.log('Usuarios de prueba:');
        console.log('  admin@inventario.pe / admin123    (Administrador)');
        console.log('  almacen@inventario.pe / almacen123 (Almacenero)');

        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('Error al ejecutar el seed:', error.message);
        console.error('¿Iniciaste MySQL en XAMPP?');
        process.exit(1);
    }
}

sembrar();
