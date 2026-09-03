const { Router } = require('express');
const { obtenerAuditoria } = require('../controllers/auditoriaController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

// Endpoint de consulta, solo para 'admin' (Fase 4 requerimiento)
router.get('/', verificarToken, verificarRol('admin'), obtenerAuditoria);

module.exports = router;
