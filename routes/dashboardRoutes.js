const express = require('express');
const controlador = require('../controllers/dashboardController');
const autenticar = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', autenticar(['Administrador', 'Almacenero']), controlador.resumen);

module.exports = router;
