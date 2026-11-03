const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define("Producto", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del producto es obligatorio' }
        }
    },
    descripcion: {
        type: DataTypes.TEXT
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            esMayorQueCero(valor) {
                if (Number(valor) <= 0) {
                    throw new Error('El precio debe ser mayor que 0');
                }
            }
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'El stock no puede ser negativo' }
        }
    },
    // Laboratorio #9: la tabla ya tenia datos, por eso la FK admite NULL en la
    // base de datos aunque la API exija categoria al crear o editar.
    categoria_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    proveedor_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'Productos',
    underscored: true,
    timestamps: true // Crea automaticamente created_at y updated_at
});

module.exports = Producto;
