const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Categoria = sequelize.define("Categoria", {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El nombre de la categoria es obligatorio' }
        }
    },
    descripcion: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Categorias',
    underscored: true,
    timestamps: true
});

module.exports = Categoria;
