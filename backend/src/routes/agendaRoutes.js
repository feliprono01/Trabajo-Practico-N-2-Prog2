const { Router } = require('express');
const { obtenerAgenda, crearAgenda, actualizarAgenda, eliminarAgenda } = require('../controllers/agendaController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

// Todas las rutas de agenda requieren al menos rol medico, operador o admin
router.use(verificarToken, verificarRol('medico', 'operador', 'admin'));

router.get('/', obtenerAgenda);
router.post('/', crearAgenda);
router.put('/:id', actualizarAgenda);
router.delete('/:id', eliminarAgenda);

module.exports = router;
