const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { manejadorDeErrores } = require('./middlewares/error');

const categoriaRoutes = require('./routes/categoriaRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// --- MIDDLEWARES ---
// Habilitar CORS para permitir peticiones desde el frontend (React)
app.use(cors());
// Parsear el body de las peticiones a JSON
app.use(express.json());

// --- RUTAS ---
app.get('/', (req, res) => {
    res.json({ mensaje: 'API miApi - Inventario funcionando' });
});

app.use('/categorias', categoriaRoutes);
app.use('/proveedores', proveedorRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/productos', productoRoutes);
app.use('/movimientos', movimientoRoutes);
app.use('/dashboard', dashboardRoutes);

// --- 404: ninguna ruta coincidio ---
app.use((req, res) => {
    res.status(404).json({ mensaje: `La ruta ${req.method} ${req.originalUrl} no existe` });
});

// --- MANEJADOR DE ERRORES (siempre al final) ---
app.use(manejadorDeErrores);

module.exports = app;
