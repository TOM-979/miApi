const { sequelize, Movimiento, Producto, Usuario } = require('../models');
const { errorHttp } = require('../middlewares/error');

const TIPOS = ['Entrada', 'Salida', 'Ajuste'];

const INCLUDES = [
    { model: Producto, as: 'producto', attributes: ['id', 'nombre'] },
    { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }
];

/**
 * Registra un movimiento de inventario DENTRO DE UNA TRANSACCION.
 *
 * El problema: actualizar el stock del producto e insertar la fila del kardex
 * son dos escrituras distintas. Si la segunda falla, el stock quedaria
 * modificado sin su movimiento que lo justifique (inventario descuadrado).
 * La transaccion hace que ambas escrituras sean una sola operacion atomica:
 * o se guardan las dos, o no se guarda ninguna (rollback).
 *
 * Pasos:
 *   1) Buscar el producto con lock: UPDATE  -> bloquea la fila para que dos
 *      peticiones simultaneas no lean el mismo stock y lo sobreescriban.
 *   2) Calcular el nuevo stock segun el tipo de movimiento.
 *   3) Guardar el nuevo stock en Productos.
 *   4) Insertar el Movimiento con el stock_resultante.
 *
 * Se exporta aparte del controlador para que el seeder use exactamente la
 * misma logica.
 */
async function registrarMovimiento({ producto_id, usuario_id, tipo_movimiento, cantidad, observaciones }) {
    // --- Validaciones previas (fuera de la transaccion: no escriben nada) ---
    if (!producto_id) throw errorHttp(400, 'El producto es obligatorio');
    if (!usuario_id) throw errorHttp(400, 'El usuario es obligatorio');
    if (!tipo_movimiento || !TIPOS.includes(tipo_movimiento)) {
        throw errorHttp(400, "El tipo de movimiento debe ser 'Entrada', 'Salida' o 'Ajuste'");
    }
    if (cantidad === undefined || cantidad === null || cantidad === '' || !Number.isInteger(Number(cantidad))) {
        throw errorHttp(400, 'La cantidad debe ser un numero entero');
    }

    const cantidadNumero = Number(cantidad);

    if (tipo_movimiento === 'Ajuste') {
        // El ajuste suma su cantidad y puede ser negativo, pero nunca 0
        if (cantidadNumero === 0) throw errorHttp(400, 'La cantidad del ajuste no puede ser 0');
    } else if (cantidadNumero <= 0) {
        // Entrada y Salida siempre se expresan con cantidad positiva
        throw errorHttp(400, 'La cantidad debe ser mayor que 0');
    }

    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) throw errorHttp(400, 'El usuario indicado no existe');

    // sequelize.transaction() con callback hace COMMIT automatico si todo sale
    // bien y ROLLBACK automatico si se lanza cualquier error dentro.
    return sequelize.transaction(async (t) => {
        // 1) Leer el producto bloqueando su fila hasta terminar la transaccion
        const producto = await Producto.findByPk(producto_id, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!producto) throw errorHttp(400, 'El producto indicado no existe');

        // 2) Calcular el nuevo stock segun el tipo de movimiento
        const stockActual = Number(producto.stock);
        let stockResultante;

        if (tipo_movimiento === 'Entrada') {
            stockResultante = stockActual + cantidadNumero;
        } else if (tipo_movimiento === 'Salida') {
            stockResultante = stockActual - cantidadNumero;
            if (stockResultante < 0) {
                // Se aborta: el throw provoca el rollback, nada queda guardado
                throw errorHttp(409, `Stock insuficiente. Stock actual: ${stockActual}, solicitado: ${cantidadNumero}`);
            }
        } else {
            // Ajuste: la cantidad se suma tal cual (puede ser negativa)
            stockResultante = stockActual + cantidadNumero;
            if (stockResultante < 0) {
                throw errorHttp(409, `El ajuste dejaria el stock en negativo. Stock actual: ${stockActual}`);
            }
        }

        // 3) Actualizar el stock del producto (dentro de la transaccion)
        await producto.update({ stock: stockResultante }, { transaction: t });

        // 4) Insertar el movimiento con el stock que quedo despues del cambio
        const movimiento = await Movimiento.create({
            producto_id: producto.id,
            usuario_id,
            tipo_movimiento,
            cantidad: cantidadNumero,
            stock_resultante: stockResultante,
            fecha_hora: new Date(),
            observaciones: observaciones || null
        }, { transaction: t });

        return movimiento;
        // Al salir sin errores -> COMMIT. Si algo fallo -> ROLLBACK total.
    });
}

// GET /movimientos?producto_id=&tipo=
exports.listar = async (req, res, next) => {
    try {
        const { producto_id, tipo } = req.query;
        const where = {};
        if (producto_id) where.producto_id = producto_id;
        if (tipo) {
            if (!TIPOS.includes(tipo)) {
                throw errorHttp(400, "El tipo debe ser 'Entrada', 'Salida' o 'Ajuste'");
            }
            where.tipo_movimiento = tipo;
        }

        const movimientos = await Movimiento.findAll({
            where,
            include: INCLUDES,
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']]
        });

        res.json(movimientos);
    } catch (error) {
        next(error);
    }
};

// GET /movimientos/:id
exports.obtener = async (req, res, next) => {
    try {
        const movimiento = await Movimiento.findByPk(req.params.id, { include: INCLUDES });
        if (!movimiento) throw errorHttp(404, 'El movimiento no existe');
        res.json(movimiento);
    } catch (error) {
        next(error);
    }
};

// POST /movimientos -> aplica el movimiento de forma transaccional
exports.crear = async (req, res, next) => {
    try {
        const creado = await registrarMovimiento(req.body);
        const movimiento = await Movimiento.findByPk(creado.id, { include: INCLUDES });
        res.status(201).json(movimiento);
    } catch (error) {
        next(error);
    }
};

exports.registrarMovimiento = registrarMovimiento;
