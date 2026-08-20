const { Router } = require('express');
const { obtenerEspecialidades, crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad } = require('../controllers/especialidadController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

// Todas las rutas protegidas solo para 'admin'
router.use(verificarToken, verificarRol('admin'));

router.get('/', obtenerEspecialidades);
router.post('/', crearEspecialidad);
router.put('/:id', actualizarEspecialidad);
router.delete('/:id', eliminarEspecialidad);

module.exports = router;
