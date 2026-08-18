const { Router } = require('express');
const { obtenerSedes, crearSede, actualizarSede, eliminarSede } = require('../controllers/sedeController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

// Todas las rutas protegidas solo para 'admin'
router.use(verificarToken, verificarRol('admin'));

router.get('/', obtenerSedes);
router.post('/', crearSede);
router.put('/:id', actualizarSede);
router.delete('/:id', eliminarSede);

module.exports = router;
