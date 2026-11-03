const express = require('express');
const controlador = require('../controllers/productoController');
const autenticar = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', autenticar(['Administrador', 'Almacenero']), controlador.listar);
router.get('/:id', autenticar(['Administrador', 'Almacenero']), controlador.obtener);
router.post('/', autenticar(['Administrador', 'Almacenero']), controlador.crear);
router.put('/:id', autenticar(['Administrador', 'Almacenero']), controlador.actualizar);
router.delete('/:id', autenticar(['Administrador']), controlador.eliminar);

module.exports = router;
