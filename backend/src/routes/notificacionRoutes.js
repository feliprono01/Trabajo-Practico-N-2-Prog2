const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Todos los endpoints de notificaciones requieren estar autenticado
router.use(verificarToken);

// Obtener notificaciones del usuario
router.get('/', notificacionController.listarNotificaciones);

// Marcar notificación como leída
router.put('/:id/leida', notificacionController.marcarLeida);

module.exports = router;
