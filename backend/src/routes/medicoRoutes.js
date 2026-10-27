const { Router } = require('express');
const { listarMedicos } = require('../controllers/medicoController');
const { verificarToken } = require('../middlewares/authMiddleware');

const router = Router();

// Accesible para cualquier usuario logueado (operador carga agenda, médico ve sus
// propias especialidades, paciente elige médico al pedir turno).
router.get('/', verificarToken, listarMedicos);

module.exports = router;
