const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /especialidades
 */
const obtenerEspecialidades = async (req, res) => {
  try {
    const [especialidades] = await pool.query('SELECT * FROM especialidad');
    respuesta(res, 200, 'ok', especialidades);
  } catch (error) {
    console.error('Error al obtener especialidades:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * POST /especialidades
 */
const crearEspecialidad = async (req, res) => {
  const { descripcion } = req.body;
  if (!descripcion) {
    return respuesta(res, 400, 'La descripción es obligatoria', null);
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO especialidad (descripcion) VALUES (?)',
      [descripcion]
    );
    respuesta(res, 201, 'Especialidad creada', { id: result.insertId, descripcion });
  } catch (error) {
    console.error('Error al crear especialidad:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * PUT /especialidades/:id
 */
const actualizarEspecialidad = async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;
  
  if (!descripcion) {
    return respuesta(res, 400, 'La descripción es obligatoria', null);
  }
  try {
    const [result] = await pool.query(
      'UPDATE especialidad SET descripcion = ? WHERE id = ?',
      [descripcion, id]
    );
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Especialidad no encontrada', null);
    }
    respuesta(res, 200, 'Especialidad actualizada', { id, descripcion });
  } catch (error) {
    console.error('Error al actualizar especialidad:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * DELETE /especialidades/:id
 */
const eliminarEspecialidad = async (req, res) => {
  const { id } = req.params;
  try {
    // Validar dependencias: medico_especialidad
    const [medicos] = await pool.query('SELECT id FROM medico_especialidad WHERE id_especialidad = ?', [id]);
    if (medicos.length > 0) {
      return respuesta(res, 409, 'No se puede eliminar la especialidad porque hay médicos asociados a ella', null);
    }

    const [result] = await pool.query('DELETE FROM especialidad WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Especialidad no encontrada', null);
    }
    respuesta(res, 200, 'Especialidad eliminada', null);
  } catch (error) {
    console.error('Error al eliminar especialidad:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { obtenerEspecialidades, crearEspecialidad, actualizarEspecialidad, eliminarEspecialidad };
