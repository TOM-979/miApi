const { Categoria, Producto } = require('../models');
const { errorHttp } = require('../middlewares/error');

// GET /categorias -> lista con la cantidad de productos de cada categoria
exports.listar = async (req, res, next) => {
    try {
        const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });

        const resultado = await Promise.all(categorias.map(async (categoria) => {
            const productosCount = await Producto.count({ where: { categoria_id: categoria.id } });
            return { ...categoria.toJSON(), productosCount };
        }));

        res.json(resultado);
    } catch (error) {
        next(error);
    }
};

// GET /categorias/:id
exports.obtener = async (req, res, next) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        if (!categoria) throw errorHttp(404, 'La categoria no existe');
        res.json(categoria);
    } catch (error) {
        next(error);
    }
};

// POST /categorias
exports.crear = async (req, res, next) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre || String(nombre).trim() === '') {
            throw errorHttp(400, 'El nombre de la categoria es obligatorio');
        }
        const categoria = await Categoria.create({ nombre: String(nombre).trim(), descripcion });
        res.status(201).json(categoria);
    } catch (error) {
        next(error);
    }
};

// PUT /categorias/:id
exports.actualizar = async (req, res, next) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        if (!categoria) throw errorHttp(404, 'La categoria no existe');

        const { nombre, descripcion } = req.body;
        if (nombre !== undefined && String(nombre).trim() === '') {
            throw errorHttp(400, 'El nombre de la categoria es obligatorio');
        }

        await categoria.update({
            nombre: nombre !== undefined ? String(nombre).trim() : categoria.nombre,
            descripcion: descripcion !== undefined ? descripcion : categoria.descripcion
        });

        res.json(categoria);
    } catch (error) {
        next(error);
    }
};

// DELETE /categorias/:id -> 409 si tiene productos asociados
exports.eliminar = async (req, res, next) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        if (!categoria) throw errorHttp(404, 'La categoria no existe');

        const productos = await Producto.count({ where: { categoria_id: categoria.id } });
        if (productos > 0) {
            throw errorHttp(409, `No se puede eliminar la categoria porque tiene ${productos} producto(s) asociado(s)`);
        }

        await categoria.destroy();
        res.json({ mensaje: 'Categoria eliminada correctamente' });
    } catch (error) {
        next(error);
    }
};
