const express = require('express');
const controlador = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', controlador.resumen);

module.exports = router;
