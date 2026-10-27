const { Router } = require('express');
const { obtenerSedes, crearSede, actualizarSede, eliminarSede } = require('../controllers/sedeController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

// Lectura disponible para cualquier usuario logueado (cualquier rol la necesita para armar formularios)
router.get('/', verificarToken, obtenerSedes);

// Alta, modificación y baja siguen siendo exclusivas del rol admin
router.post('/', verificarToken, verificarRol('admin'), auditoriaMiddleware('sede'), crearSede);
router.put('/:id', verificarToken, verificarRol('admin'), auditoriaMiddleware('sede'), actualizarSede);
router.delete('/:id', verificarToken, verificarRol('admin'), auditoriaMiddleware('sede'), eliminarSede);

module.exports = router;
