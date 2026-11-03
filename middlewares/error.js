// Convierte los errores de Sequelize y los errores propios en respuestas
// JSON uniformes: { "mensaje": "..." } siempre en espanol.

// Traduce el nombre de la restriccion unica a un mensaje entendible
function mensajeDeUnico(error) {
    const campo = error.errors && error.errors[0] ? error.errors[0].path : null;
    if (campo === 'email') return 'Ya existe un registro con ese email';
    if (campo === 'nombre') return 'Ya existe un registro con ese nombre';
    return 'Ya existe un registro con ese valor unico';
}

function manejadorDeErrores(err, req, res, next) {
    // Error de validacion de modelo (campos obligatorios, formatos, rangos)
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({ mensaje: err.errors.map(e => e.message).join('. ') });
    }

    // Violacion de restriccion unica (email o nombre repetido)
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ mensaje: mensajeDeUnico(err) });
    }

    // La FK apunta a un registro que no existe
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ mensaje: 'No se puede completar la operacion porque hay registros relacionados' });
    }

    // JSON mal formado en el body
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ mensaje: 'El cuerpo de la peticion no es un JSON valido' });
    }

    // Errores lanzados a proposito por los controladores
    if (err.status) {
        return res.status(err.status).json({ mensaje: err.message });
    }

    console.error('Error no controlado:', err);
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
}

// Atajo para lanzar errores con codigo HTTP desde los controladores
function errorHttp(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

module.exports = { manejadorDeErrores, errorHttp };
