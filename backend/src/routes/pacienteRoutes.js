const { Router } = require('express');
const { buscarPacientes } = require('../controllers/pacienteController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

router.get('/buscar', verificarToken, verificarRol('operador', 'medico', 'admin'), buscarPacientes);

module.exports = router;
