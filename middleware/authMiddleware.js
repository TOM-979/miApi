const jwt = require('jsonwebtoken');

/**
 * Autenticacion y autorizacion por rol.
 * Uso:  router.get('/', autenticar(['Administrador', 'Almacenero']), controlador.listar)
 *
 * Protege contra: acceso sin credenciales (403), suplantacion o manipulacion del
 * token (firma invalida), tokens vencidos y escalada de privilegios (rol insuficiente).
 */
module.exports = (rolesPermitidos = []) => (req, res, next) => {
    // Cabecera esperada: "Authorization: Bearer <token>"
    const cabecera = req.headers['authorization'];
    const token = cabecera && cabecera.startsWith('Bearer ') ? cabecera.split(' ')[1] : null;

    if (!token) {
        return res.status(403).json({ error: 'Acceso denegado: Token no proporcionado.' });
    }

    let decodificado;
    try {
        // Verifica la firma con JWT_SECRET y que no haya expirado
        decodificado = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }

    req.usuario = decodificado;

    // Si se indicaron roles, el del token debe estar entre ellos
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(decodificado.rol)) {
        return res.status(401).json({ error: 'No autorizado: Permisos insuficientes.' });
    }

    next();
};
