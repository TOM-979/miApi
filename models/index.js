const sequelize = require('../config/db');

const Categoria = require('./categoria');
const Proveedor = require('./proveedor');
const Usuario = require('./usuario');
const Producto = require('./producto');
const Movimiento = require('./movimiento');

// --- ASOCIACIONES ---
// Una categoria tiene muchos productos / un producto pertenece a una categoria
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos', onDelete: 'RESTRICT' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

// Un proveedor tiene muchos productos / un producto pertenece a un proveedor (opcional)
Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos', onDelete: 'RESTRICT' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// Un producto tiene muchos movimientos (su kardex)
Producto.hasMany(Movimiento, { foreignKey: 'producto_id', as: 'movimientos', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Un usuario registra muchos movimientos
Usuario.hasMany(Movimiento, { foreignKey: 'usuario_id', as: 'movimientos', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
    sequelize,
    Categoria,
    Proveedor,
    Usuario,
    Producto,
    Movimiento
};
