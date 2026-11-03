const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

// Seguridad: Sequelize previene SQL Injection porque ejecuta consultas
// parametrizadas (los valores nunca se concatenan al SQL).
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
        // Cifra la contrasena (bcrypt, salt de 10 rondas) antes de insertar el registro
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        },
        // Solo re-hashea si el campo password realmente cambio
        beforeUpdate: async (usuario) => {
            if (usuario.changed('password') && usuario.password) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
    }
});

// Compara una contrasena en texto plano contra el hash guardado
Usuario.prototype.validarPassword = function (passwordPlano) {
    return bcrypt.compare(passwordPlano, this.password);
};

module.exports = Usuario;
