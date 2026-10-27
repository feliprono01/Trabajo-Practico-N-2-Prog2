const { Router } = require('express');
const { listarUsuarios, crearUsuario, actualizarUsuario } = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

router.use(verificarToken, verificarRol('admin'));

router.get('/', listarUsuarios);
router.post('/', auditoriaMiddleware('usuario'), crearUsuario);
router.put('/:id', auditoriaMiddleware('usuario'), actualizarUsuario);

module.exports = router;
