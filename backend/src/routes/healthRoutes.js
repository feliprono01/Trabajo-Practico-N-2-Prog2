const { Router } = require('express');
const { health } = require('../controllers/healthController');

const router = Router();

// GET /health
router.get('/', health);

module.exports = router;
