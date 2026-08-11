const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /coberturas
 * Devuelve el listado de coberturas médicas disponibles.
 */
const getCoberturas = async (req, res) => {
  try {
    const [coberturas] = await pool.query('SELECT id, nombre FROM cobertura');
    respuesta(res, 200, 'ok', coberturas);
  } catch (error) {
    console.error('Error al obtener coberturas:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { getCoberturas };
