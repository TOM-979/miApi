const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { manejadorDeErrores } = require('./middlewares/error');

const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- MIDDLEWARES DE SEGURIDAD (el orden importa) ---

// 1. Helmet: agrega cabeceras HTTP seguras (X-Frame-Options, CSP, nosniff, etc.).
//    Protege contra XSS, clickjacking y sniffing de tipo MIME.
app.use(helmet());

// 2. CORS restringido: solo el frontend autorizado, con metodos y cabeceras explicitas.
//    Protege contra peticiones desde sitios no confiables (abuso entre origenes / CSRF).
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate limit: maximo 100 peticiones por IP cada 15 minutos sobre /api/.
//    Protege contra fuerza bruta (adivinar contrasenas) y ataques de denegacion de servicio.
const limitador = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.' }
});
app.use('/api/', limitador);

// 4. Parseo de JSON: SIEMPRE antes de registrar cualquier ruta, o req.body llega undefined.
app.use(express.json());

// --- RUTAS ---
app.get('/', (req, res) => {
    res.json({ mensaje: 'API miApi - Inventario funcionando' });
});

// Rutas abiertas (registro y login)
app.use('/api/auth', authRoutes);

// Rutas protegidas con JWT y roles (ver cada archivo en routes/)
app.use('/api/categorias', categoriaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- 404: ninguna ruta coincidio ---
app.use((req, res) => {
    res.status(404).json({ mensaje: `La ruta ${req.method} ${req.originalUrl} no existe` });
});

// --- MANEJADOR DE ERRORES (siempre al final) ---
app.use(manejadorDeErrores);

module.exports = app;
