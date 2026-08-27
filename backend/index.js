require('dotenv').config();
const express = require('express');

const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const coberturaRoutes = require('./src/routes/coberturaRoutes');
const sedeRoutes = require('./src/routes/sedeRoutes');
const especialidadRoutes = require('./src/routes/especialidadRoutes');
const agendaRoutes = require('./src/routes/agendaRoutes');
const notificacionRoutes = require('./src/routes/notificacionRoutes');
const turnoRoutes = require('./src/routes/turnoRoutes');
const historialClinicoRoutes = require('./src/routes/historialClinicoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());

// Rutas
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/coberturas', coberturaRoutes);
app.use('/sedes', sedeRoutes);
app.use('/especialidades', especialidadRoutes);
app.use('/agenda', agendaRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/turnos', turnoRoutes);
app.use('/historial-clinico', historialClinicoRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    codigo: 404,
    estado: 'Ruta no encontrada',
    datos: null,
  });
});

// Manejador de errores no controlados
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ codigo: 500, estado: 'Error interno del servidor', datos: null });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
