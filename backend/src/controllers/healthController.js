const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /health
 * Verifica que el servidor y la base de datos estén funcionando.
 */
const health = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    respuesta(res, 200, 'ok', { mensaje: 'Servidor y base de datos funcionando correctamente' });
  } catch (error) {
    console.error('Error de conexión a la BD:', error.message);
    respuesta(res, 500, 'Error de conexión a la base de datos', null);
  }
};

module.exports = { health };
