const { Router } = require('express');
const { 
  getTurnosPorEspecialidad, 
  getTurnosPorSede, 
  getRankingMedicos, 
  getTasaCancelacion 
} = require('../controllers/reportesController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

// Todas las rutas de reportes están protegidas y son solo para 'admin'
router.use(verificarToken, verificarRol('admin'));

router.get('/turnos-especialidad', getTurnosPorEspecialidad);
router.get('/turnos-sede', getTurnosPorSede);
router.get('/ranking-medicos', getRankingMedicos);
router.get('/tasa-cancelacion', getTasaCancelacion);

module.exports = router;
