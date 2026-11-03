const express = require('express');
const controlador = require('../controllers/movimientoController');
const autenticar = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', autenticar(['Administrador', 'Almacenero']), controlador.listar);
router.get('/:id', autenticar(['Administrador', 'Almacenero']), controlador.obtener);
router.post('/', autenticar(['Administrador', 'Almacenero']), controlador.crear);

module.exports = router;
