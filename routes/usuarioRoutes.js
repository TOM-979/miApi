const express = require('express');
const controlador = require('../controllers/usuarioController');
const autenticar = require('../middleware/authMiddleware');

const router = express.Router();

// Toda la gestion de usuarios es solo para Administradores
router.get('/', autenticar(['Administrador']), controlador.listar);
router.get('/:id', autenticar(['Administrador']), controlador.obtener);
router.post('/', autenticar(['Administrador']), controlador.crear);
router.put('/:id', autenticar(['Administrador']), controlador.actualizar);
router.delete('/:id', autenticar(['Administrador']), controlador.eliminar);

module.exports = router;
