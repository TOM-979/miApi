const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const Usuario = sequelize.define("Usuario", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del usuario es obligatorio' }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'El email no tiene un formato valido' }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La contrasena es obligatoria' }
        }
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Almacenero'),
        allowNull: false,
        defaultValue: 'Almacenero'
    }
}, {
    tableName: 'Usuarios',
    underscored: true,
    timestamps: true,
    // La contrasena nunca se devuelve en las consultas normales.
    // Para leerla (por ejemplo en un login) hay que pedir el scope 'conPassword'.
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    scopes: {
        conPassword: { attributes: { include: ['password'] } }
    },
    hooks: {
        // Hashea la contrasena antes de insertar el registro
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                usuario.password = await bcrypt.hash(usuario.password, 10);
            }
        },
        // Solo re-hashea si el campo password realmente cambio
        beforeUpdate: async (usuario) => {
            if (usuario.changed('password') && usuario.password) {
                usuario.password = await bcrypt.hash(usuario.password, 10);
            }
        }
    }
});

// Compara una contrasena en texto plano contra el hash guardado
Usuario.prototype.validarPassword = function (passwordPlano) {
    return bcrypt.compare(passwordPlano, this.password);
};

module.exports = Usuario;
