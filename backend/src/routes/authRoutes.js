const { Router } = require('express');
const { registro, login, perfil } = require('../controllers/authController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');
const auditoriaMiddleware = require('../middlewares/auditoriaMiddleware');

const router = Router();

// POST /auth/registro — Fase 4
router.post('/registro', auditoriaMiddleware('usuario'), registro);

// POST /auth/login — Fase 5
router.post('/login', login);

// GET /auth/perfil — Fase 6 (requiere token válido)
router.get('/perfil', verificarToken, perfil);

// GET /auth/admin-test — Fase 6 (prueba de verificarRol, solo admin)
router.get('/admin-test', verificarToken, verificarRol('admin'), (req, res) => {
  const respuesta = require('../helpers/respuesta');
  respuesta(res, 200, 'ok', { mensaje: `Bienvenido admin, tu id es ${req.usuario.id}` });
});

module.exports = router;
