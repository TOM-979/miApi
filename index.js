require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3006;

async function iniciar() {
    try {
        // Verifica que MySQL responda antes de intentar sincronizar
        await sequelize.authenticate();

        // alter: true agrega las columnas y tablas nuevas sin borrar los datos
        await sequelize.sync({ alter: true });
        console.log('Base de datos conectada y tablas sincronizadas');

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo conectar con la base de datos MySQL.');
        console.error('¿Iniciaste MySQL en XAMPP? Revisa tambien DB_NAME, DB_USER, DB_PASS y DB_HOST en tu archivo .env');
        console.error('Detalle:', error.message);
        process.exit(1);
    }
}

iniciar();
