const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define("Proveedor", {
    razon_social: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La razon social es obligatoria' }
        }
    },
    contacto: {
        type: DataTypes.STRING
    },
    telefono: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        validate: {
            // Solo se valida el formato cuando el campo viene con contenido
            esEmailValido(valor) {
                if (valor !== null && valor !== undefined && valor !== '') {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
                        throw new Error('El email del proveedor no tiene un formato valido');
                    }
                }
            }
        }
    }
}, {
    tableName: 'Proveedores',
    underscored: true,
    timestamps: true
});

module.exports = Proveedor;
