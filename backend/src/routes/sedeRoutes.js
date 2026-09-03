const { Router } = require('express');
const { obtenerSedes, crearSede, actualizarSede, eliminarSede } = require('../controllers/sedeController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

// Todas las rutas protegidas solo para 'admin'
router.use(verificarToken, verificarRol('admin'));

router.get('/', obtenerSedes);
router.post('/', auditoriaMiddleware('sede'), crearSede);
router.put('/:id', auditoriaMiddleware('sede'), actualizarSede);
router.delete('/:id', auditoriaMiddleware('sede'), eliminarSede);

module.exports = router;
