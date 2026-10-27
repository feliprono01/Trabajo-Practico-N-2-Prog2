const { Router } = require('express');
const { obtenerEspecialidades, crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad } = require('../controllers/especialidadController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

// Lectura disponible para cualquier usuario logueado
router.get('/', verificarToken, obtenerEspecialidades);

// Alta, modificación y baja siguen siendo exclusivas del rol admin
router.post('/', verificarToken, verificarRol('admin'), auditoriaMiddleware('especialidad'), crearEspecialidad);
router.put('/:id', verificarToken, verificarRol('admin'), auditoriaMiddleware('especialidad'), actualizarEspecialidad);
router.delete('/:id', verificarToken, verificarRol('admin'), auditoriaMiddleware('especialidad'), eliminarEspecialidad);

module.exports = router;
