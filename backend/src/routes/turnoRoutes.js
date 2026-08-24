const express = require('express');
const router = express.Router();
const turnoController = require('../controllers/turnoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

// Todos los endpoints de turnos requieren estar autenticado
router.use(verificarToken);

// Alta de turno (pacientes u operadores)
router.post('/', verificarRol('paciente', 'operador'), turnoController.altaTurno);

// Cancelar un turno
router.put('/:id/cancelar', verificarRol('paciente', 'operador', 'medico'), turnoController.cancelarTurno);

// Atender un turno
router.put('/:id/atender', verificarRol('medico'), turnoController.atenderTurno);

// Listados
router.get('/mis-turnos', verificarRol('paciente'), turnoController.listarTurnosPaciente);
router.get('/medico', verificarRol('medico'), turnoController.listarTurnosMedico);
router.get('/sede', verificarRol('operador'), turnoController.listarTurnosSede);

module.exports = router;
