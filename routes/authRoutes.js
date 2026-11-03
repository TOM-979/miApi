const express = require('express');
const { registrar, login } = require('../controllers/authController');

const router = express.Router();

// Rutas abiertas (no requieren token)
router.post('/register', registrar);
router.post('/login', login);

module.exports = router;
