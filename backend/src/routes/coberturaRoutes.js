const { Router } = require('express');
const { getCoberturas } = require('../controllers/coberturaController');

const router = Router();

// GET /coberturas
router.get('/', getCoberturas);

module.exports = router;
