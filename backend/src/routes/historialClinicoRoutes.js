const express = require('express');
const router = express.Router();
const historialClinicoController = require('../controllers/historialClinicoController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.use(verificarToken);

// Alta de historial clínico (sólo médicos)
router.post('/', verificarRol('medico'), historialClinicoController.altaHistorial);

// Consulta de historial clínico
// Paciente: Ve el propio. Médico: Ve los suyos del paciente.
router.get('/:id_paciente', verificarRol('paciente', 'medico'), historialClinicoController.consultarHistorial);

module.exports = router;
