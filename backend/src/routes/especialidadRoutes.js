const { Router } = require('express');
const { obtenerEspecialidades, crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad } = require('../controllers/especialidadController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

// Todas las rutas protegidas solo para 'admin'
router.use(verificarToken, verificarRol('admin'));

router.get('/', obtenerEspecialidades);
router.post('/', auditoriaMiddleware('especialidad'), crearEspecialidad);
router.put('/:id', auditoriaMiddleware('especialidad'), actualizarEspecialidad);
router.delete('/:id', auditoriaMiddleware('especialidad'), eliminarEspecialidad);

module.exports = router;
