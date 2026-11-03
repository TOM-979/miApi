const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

// POST /api/auth/register  (ruta abierta)
exports.registrar = async (req, res, next) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
        }
        if (rol !== undefined && !['Administrador', 'Almacenero'].includes(rol)) {
            return res.status(400).json({ error: "El rol debe ser 'Administrador' o 'Almacenero'" });
        }

        // Consulta parametrizada por Sequelize (previene SQL Injection)
        const existente = await Usuario.findOne({ where: { email: String(email).trim() } });
        if (existente) {
            return res.status(400).json({ error: 'El correo ya se encuentra registrado' });
        }

        // La contraseña se cifra en el hook beforeCreate del modelo
        const usuario = await Usuario.create({
            nombre: String(nombre).trim(),
            email: String(email).trim(),
            password,
            rol
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente', id: usuario.id });
    } catch (error) {
        // Errores de validacion (p. ej. email mal formado) los traduce middlewares/error.js
        next(error);
    }
};

// POST /api/auth/login  (ruta abierta)
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // El defaultScope oculta la password; este scope la incluye para poder compararla
        const usuario = await Usuario.scope('conPassword').findOne({ where: { email: String(email).trim() } });

        // Mismo mensaje si el correo no existe o la contraseña no coincide:
        // asi no se revela cuales correos estan registrados
        const valido = usuario && await bcrypt.compare(String(password), usuario.password);
        if (!valido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
        });
    } catch (error) {
        next(error);
    }
};
