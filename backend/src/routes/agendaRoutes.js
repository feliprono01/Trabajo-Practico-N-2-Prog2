const { Router } = require('express');
const {
  obtenerAgenda,
  crearAgenda,
  actualizarAgenda,
  eliminarAgenda,
  obtenerFechasDisponibles,
  obtenerHorariosDisponibles,
} = require('../controllers/agendaController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

router.use(verificarToken);

// Consulta de disponibilidad: accesible también a paciente y operador (para el wizard de turno)
router.get('/fechas-disponibles', verificarRol('medico', 'operador', 'admin', 'paciente'), obtenerFechasDisponibles);
router.get('/horarios-disponibles', verificarRol('medico', 'operador', 'admin', 'paciente'), obtenerHorariosDisponibles);

// Resto de la gestión de agenda: medico, operador y admin
router.get('/', verificarRol('medico', 'operador', 'admin'), obtenerAgenda);
router.post('/', verificarRol('medico', 'operador', 'admin'), auditoriaMiddleware('agenda'), crearAgenda);
router.put('/:id', verificarRol('medico', 'operador', 'admin'), auditoriaMiddleware('agenda'), actualizarAgenda);
router.delete('/:id', verificarRol('medico', 'operador', 'admin'), auditoriaMiddleware('agenda'), eliminarAgenda);

module.exports = router;
