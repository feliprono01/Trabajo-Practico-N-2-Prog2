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

/**
 * POST /coberturas
 */
const crearCobertura = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) {
    return respuesta(res, 400, 'El nombre es obligatorio', null);
  }
  try {
    const [result] = await pool.query('INSERT INTO cobertura (nombre) VALUES (?)', [nombre]);
    respuesta(res, 201, 'Cobertura creada', { id: result.insertId, nombre });
  } catch (error) {
    console.error('Error al crear cobertura:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * PUT /coberturas/:id
 */
const actualizarCobertura = async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre) {
    return respuesta(res, 400, 'El nombre es obligatorio', null);
  }
  try {
    const [result] = await pool.query('UPDATE cobertura SET nombre = ? WHERE id = ?', [nombre, id]);
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Cobertura no encontrada', null);
    }
    respuesta(res, 200, 'Cobertura actualizada', { id, nombre });
  } catch (error) {
    console.error('Error al actualizar cobertura:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * DELETE /coberturas/:id
 */
const eliminarCobertura = async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar si algún usuario tiene asociada esta cobertura
    const [usuarios] = await pool.query('SELECT id FROM usuario WHERE id_cobertura = ?', [id]);
    if (usuarios.length > 0) {
      return respuesta(res, 409, 'No se puede eliminar la cobertura porque hay usuarios asociados a ella', null);
    }

    const [result] = await pool.query('DELETE FROM cobertura WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Cobertura no encontrada', null);
    }
    respuesta(res, 200, 'Cobertura eliminada', null);
  } catch (error) {
    console.error('Error al eliminar cobertura:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { getCoberturas, crearCobertura, actualizarCobertura, eliminarCobertura };
