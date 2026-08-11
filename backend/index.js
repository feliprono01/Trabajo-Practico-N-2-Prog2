require('dotenv').config();
const express = require('express');

const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const coberturaRoutes = require('./src/routes/coberturaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());

// Rutas
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/coberturas', coberturaRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    codigo: 404,
    estado: 'Ruta no encontrada',
    datos: null,
  });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
