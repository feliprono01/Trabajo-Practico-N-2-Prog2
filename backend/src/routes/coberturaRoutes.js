const { Router } = require('express');
const { getCoberturas, crearCobertura, actualizarCobertura, eliminarCobertura } = require('../controllers/coberturaController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

const router = Router();

// GET /coberturas - Puede ser público o requerir token según se prefiera, 
// pero en registro lo usa el frontend. Lo dejamos público o protegido solo si se pide.
// El enunciado dice: "Armar además un servicio de solo lectura que liste las coberturas disponibles, reutilizable desde el registro de pacientes (semana 1)". 
// Asumimos público para que se pueda usar en el registro antes de tener token.
router.get('/', getCoberturas);

// Rutas protegidas solo para 'admin'
router.post('/', verificarToken, verificarRol('admin'), crearCobertura);
router.put('/:id', verificarToken, verificarRol('admin'), actualizarCobertura);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarCobertura);

module.exports = router;
