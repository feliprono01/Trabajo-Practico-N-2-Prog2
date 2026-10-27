require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const coberturaRoutes = require('./src/routes/coberturaRoutes');
const sedeRoutes = require('./src/routes/sedeRoutes');
const especialidadRoutes = require('./src/routes/especialidadRoutes');
const agendaRoutes = require('./src/routes/agendaRoutes');
const notificacionRoutes = require('./src/routes/notificacionRoutes');
const turnoRoutes = require('./src/routes/turnoRoutes');
const historialClinicoRoutes = require('./src/routes/historialClinicoRoutes');
const auditoriaRoutes = require('./src/routes/auditoriaRoutes');
const reportesRoutes = require('./src/routes/reportesRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const medicoRoutes = require('./src/routes/medicoRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));
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
app.use('/auditoria', auditoriaRoutes);
app.use('/reportes', reportesRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/medicos', medicoRoutes);
app.use('/pacientes', pacienteRoutes);

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
