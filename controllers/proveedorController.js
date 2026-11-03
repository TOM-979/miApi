const { Proveedor, Producto } = require('../models');
const { errorHttp } = require('../middlewares/error');

// GET /proveedores
exports.listar = async (req, res, next) => {
    try {
        const proveedores = await Proveedor.findAll({ order: [['razon_social', 'ASC']] });
        res.json(proveedores);
    } catch (error) {
        next(error);
    }
};

// GET /proveedores/:id
exports.obtener = async (req, res, next) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) throw errorHttp(404, 'El proveedor no existe');
        res.json(proveedor);
    } catch (error) {
        next(error);
    }
};

// POST /proveedores
exports.crear = async (req, res, next) => {
    try {
        const { razon_social, contacto, telefono, email } = req.body;
        if (!razon_social || String(razon_social).trim() === '') {
            throw errorHttp(400, 'La razon social es obligatoria');
        }
        const proveedor = await Proveedor.create({
            razon_social: String(razon_social).trim(),
            contacto,
            telefono,
            email
        });
        res.status(201).json(proveedor);
    } catch (error) {
        next(error);
    }
};

// PUT /proveedores/:id
exports.actualizar = async (req, res, next) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) throw errorHttp(404, 'El proveedor no existe');

        const { razon_social, contacto, telefono, email } = req.body;
        if (razon_social !== undefined && String(razon_social).trim() === '') {
            throw errorHttp(400, 'La razon social es obligatoria');
        }

        await proveedor.update({
            razon_social: razon_social !== undefined ? String(razon_social).trim() : proveedor.razon_social,
            contacto: contacto !== undefined ? contacto : proveedor.contacto,
            telefono: telefono !== undefined ? telefono : proveedor.telefono,
            email: email !== undefined ? email : proveedor.email
        });

        res.json(proveedor);
    } catch (error) {
        next(error);
    }
};

// DELETE /proveedores/:id -> 409 si tiene productos asociados
exports.eliminar = async (req, res, next) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) throw errorHttp(404, 'El proveedor no existe');

        const productos = await Producto.count({ where: { proveedor_id: proveedor.id } });
        if (productos > 0) {
            throw errorHttp(409, `No se puede eliminar el proveedor porque tiene ${productos} producto(s) asociado(s)`);
        }

        await proveedor.destroy();
        res.json({ mensaje: 'Proveedor eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
