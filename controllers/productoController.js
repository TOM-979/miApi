const { Producto, Categoria, Proveedor, Movimiento } = require('../models');
const { errorHttp } = require('../middlewares/error');

// Relaciones que se adjuntan en todas las respuestas de productos
const INCLUDES = [
    { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
    { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
];

// GET /productos
exports.listar = async (req, res, next) => {
    try {
        const productos = await Producto.findAll({ include: INCLUDES, order: [['id', 'ASC']] });
        res.json(productos);
    } catch (error) {
        next(error);
    }
};

// GET /productos/:id
exports.obtener = async (req, res, next) => {
    try {
        const producto = await Producto.findByPk(req.params.id, { include: INCLUDES });
        if (!producto) throw errorHttp(404, 'El producto no existe');
        res.json(producto);
    } catch (error) {
        next(error);
    }
};

// POST /productos
exports.crear = async (req, res, next) => {
    try {
        const { nombre, descripcion, precio, stock, categoria_id, proveedor_id } = req.body;

        if (!nombre || String(nombre).trim() === '') throw errorHttp(400, 'El nombre del producto es obligatorio');
        if (precio === undefined || precio === null || precio === '') throw errorHttp(400, 'El precio es obligatorio');
        if (isNaN(Number(precio)) || Number(precio) <= 0) throw errorHttp(400, 'El precio debe ser un numero mayor que 0');
        if (stock !== undefined && stock !== null && stock !== '' && (isNaN(Number(stock)) || Number(stock) < 0)) {
            throw errorHttp(400, 'El stock debe ser un numero entero mayor o igual a 0');
        }

        // La API exige categoria aunque la columna admita NULL en la base de datos
        if (categoria_id === undefined || categoria_id === null || categoria_id === '') {
            throw errorHttp(400, 'La categoria es obligatoria');
        }
        const categoria = await Categoria.findByPk(categoria_id);
        if (!categoria) throw errorHttp(400, 'La categoria indicada no existe');

        if (proveedor_id !== undefined && proveedor_id !== null && proveedor_id !== '') {
            const proveedor = await Proveedor.findByPk(proveedor_id);
            if (!proveedor) throw errorHttp(400, 'El proveedor indicado no existe');
        }

        const creado = await Producto.create({
            nombre: String(nombre).trim(),
            descripcion,
            precio,
            stock: stock === undefined || stock === null || stock === '' ? 0 : Number(stock),
            categoria_id,
            proveedor_id: proveedor_id === undefined || proveedor_id === '' ? null : proveedor_id
        });

        const producto = await Producto.findByPk(creado.id, { include: INCLUDES });
        res.status(201).json(producto);
    } catch (error) {
        next(error);
    }
};

// PUT /productos/:id
exports.actualizar = async (req, res, next) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) throw errorHttp(404, 'El producto no existe');

        const { nombre, descripcion, precio, stock, categoria_id, proveedor_id } = req.body;

        if (nombre !== undefined && String(nombre).trim() === '') throw errorHttp(400, 'El nombre del producto es obligatorio');
        if (precio !== undefined && (isNaN(Number(precio)) || Number(precio) <= 0)) {
            throw errorHttp(400, 'El precio debe ser un numero mayor que 0');
        }
        if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
            throw errorHttp(400, 'El stock debe ser un numero entero mayor o igual a 0');
        }

        // En la edicion la categoria sigue siendo obligatoria
        let nuevaCategoria = producto.categoria_id;
        if (categoria_id !== undefined) {
            if (categoria_id === null || categoria_id === '') throw errorHttp(400, 'La categoria es obligatoria');
            const categoria = await Categoria.findByPk(categoria_id);
            if (!categoria) throw errorHttp(400, 'La categoria indicada no existe');
            nuevaCategoria = categoria_id;
        } else if (producto.categoria_id === null) {
            throw errorHttp(400, 'La categoria es obligatoria');
        }

        let nuevoProveedor = producto.proveedor_id;
        if (proveedor_id !== undefined) {
            if (proveedor_id === null || proveedor_id === '') {
                nuevoProveedor = null;
            } else {
                const proveedor = await Proveedor.findByPk(proveedor_id);
                if (!proveedor) throw errorHttp(400, 'El proveedor indicado no existe');
                nuevoProveedor = proveedor_id;
            }
        }

        await producto.update({
            nombre: nombre !== undefined ? String(nombre).trim() : producto.nombre,
            descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
            precio: precio !== undefined ? precio : producto.precio,
            stock: stock !== undefined ? Number(stock) : producto.stock,
            categoria_id: nuevaCategoria,
            proveedor_id: nuevoProveedor
        });

        const actualizado = await Producto.findByPk(producto.id, { include: INCLUDES });
        res.json(actualizado);
    } catch (error) {
        next(error);
    }
};

// DELETE /productos/:id -> 409 si tiene movimientos en el kardex
exports.eliminar = async (req, res, next) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) throw errorHttp(404, 'El producto no existe');

        const movimientos = await Movimiento.count({ where: { producto_id: producto.id } });
        if (movimientos > 0) {
            throw errorHttp(409, `No se puede eliminar el producto porque tiene ${movimientos} movimiento(s) registrado(s)`);
        }

        await producto.destroy();
        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        next(error);
    }
};
