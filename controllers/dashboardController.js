const { Op } = require('sequelize');
const { Categoria, Proveedor, Usuario, Producto, Movimiento } = require('../models');

// GET /dashboard -> metricas resumidas del inventario
exports.resumen = async (req, res, next) => {
    try {
        const umbralBajoStock = Number(process.env.UMBRAL_BAJO_STOCK || 5);

        const [totalProductos, totalCategorias, totalProveedores, totalUsuarios] = await Promise.all([
            Producto.count(),
            Categoria.count(),
            Proveedor.count(),
            Usuario.count()
        ]);

        // Valor del inventario y unidades totales: se calculan en memoria para
        // no depender de funciones SQL especificas del motor.
        const productos = await Producto.findAll({
            include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }]
        });

        let valorInventario = 0;
        let unidadesEnStock = 0;
        productos.forEach((p) => {
            valorInventario += Number(p.precio) * Number(p.stock);
            unidadesEnStock += Number(p.stock);
        });
        valorInventario = Number(valorInventario.toFixed(2));

        const productosBajoStock = productos
            .filter((p) => Number(p.stock) <= umbralBajoStock)
            .sort((a, b) => a.stock - b.stock)
            .map((p) => ({
                id: p.id,
                nombre: p.nombre,
                stock: p.stock,
                categoria: p.categoria ? p.categoria.nombre : null
            }));

        const ultimosMovimientos = await Movimiento.findAll({
            include: [
                { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
                { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
            ],
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
            limit: 5
        });

        const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
        const productosPorCategoria = categorias.map((c) => ({
            categoria: c.nombre,
            cantidad: productos.filter((p) => p.categoria_id === c.id).length
        }));

        // Productos que todavia no tienen categoria asignada (datos antiguos)
        const sinCategoria = productos.filter((p) => p.categoria_id === null).length;
        if (sinCategoria > 0) {
            productosPorCategoria.push({ categoria: 'Sin categoria', cantidad: sinCategoria });
        }

        res.json({
            totalProductos,
            totalCategorias,
            totalProveedores,
            totalUsuarios,
            valorInventario,
            unidadesEnStock,
            bajoStock: productosBajoStock.length,
            umbralBajoStock,
            productosBajoStock,
            ultimosMovimientos,
            productosPorCategoria
        });
    } catch (error) {
        next(error);
    }
};
