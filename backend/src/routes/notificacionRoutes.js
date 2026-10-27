const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Todos los endpoints de notificaciones requieren estar autenticado
router.use(verificarToken);

// Obtener notificaciones del usuario
router.get('/', notificacionController.listarNotificaciones);

// Cantidad de notificaciones no leídas (para el badge del header)
router.get('/no-leidas', notificacionController.contarNoLeidas);

// Marcar notificación como leída
router.put('/:id/leida', notificacionController.marcarLeida);

module.exports = router;
