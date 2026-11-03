const { Usuario, Movimiento } = require('../models');
const { errorHttp } = require('../middlewares/error');

const ROLES = ['Administrador', 'Almacenero'];

// GET /usuarios (la password nunca se devuelve: la excluye el defaultScope)
exports.listar = async (req, res, next) => {
    try {
        const usuarios = await Usuario.findAll({ order: [['nombre', 'ASC']] });
        res.json(usuarios);
    } catch (error) {
        next(error);
    }
};

// GET /usuarios/:id
exports.obtener = async (req, res, next) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) throw errorHttp(404, 'El usuario no existe');
        res.json(usuario);
    } catch (error) {
        next(error);
    }
};

// POST /usuarios
exports.crear = async (req, res, next) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || String(nombre).trim() === '') throw errorHttp(400, 'El nombre es obligatorio');
        if (!email || String(email).trim() === '') throw errorHttp(400, 'El email es obligatorio');
        if (!password || String(password).trim() === '') throw errorHttp(400, 'La contrasena es obligatoria');
        if (rol !== undefined && !ROLES.includes(rol)) {
            throw errorHttp(400, "El rol debe ser 'Administrador' o 'Almacenero'");
        }

        const creado = await Usuario.create({
            nombre: String(nombre).trim(),
            email: String(email).trim(),
            password,
            rol: rol || 'Almacenero'
        });

        // Se vuelve a leer con el defaultScope para no exponer el hash
        const usuario = await Usuario.findByPk(creado.id);
        res.status(201).json(usuario);
    } catch (error) {
        next(error);
    }
};

// PUT /usuarios/:id (si password viene vacio o no viene, no se cambia)
exports.actualizar = async (req, res, next) => {
    try {
        const usuario = await Usuario.scope('conPassword').findByPk(req.params.id);
        if (!usuario) throw errorHttp(404, 'El usuario no existe');

        const { nombre, email, password, rol } = req.body;

        if (nombre !== undefined && String(nombre).trim() === '') throw errorHttp(400, 'El nombre es obligatorio');
        if (email !== undefined && String(email).trim() === '') throw errorHttp(400, 'El email es obligatorio');
        if (rol !== undefined && !ROLES.includes(rol)) {
            throw errorHttp(400, "El rol debe ser 'Administrador' o 'Almacenero'");
        }

        const datos = {
            nombre: nombre !== undefined ? String(nombre).trim() : usuario.nombre,
            email: email !== undefined ? String(email).trim() : usuario.email,
            rol: rol !== undefined ? rol : usuario.rol
        };

        // Solo se toca la contrasena cuando llega con contenido real
        if (password !== undefined && String(password).trim() !== '') {
            datos.password = password;
        }

        await usuario.update(datos);

        const actualizado = await Usuario.findByPk(usuario.id);
        res.json(actualizado);
    } catch (error) {
        next(error);
    }
};

// DELETE /usuarios/:id -> 409 si registro movimientos
exports.eliminar = async (req, res, next) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) throw errorHttp(404, 'El usuario no existe');

        const movimientos = await Movimiento.count({ where: { usuario_id: usuario.id } });
        if (movimientos > 0) {
            throw errorHttp(409, `No se puede eliminar el usuario porque tiene ${movimientos} movimiento(s) registrado(s)`);
        }

        await usuario.destroy();
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
