const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /sedes
 */
const obtenerSedes = async (req, res) => {
  try {
    const [sedes] = await pool.query('SELECT * FROM sede');
    respuesta(res, 200, 'ok', sedes);
  } catch (error) {
    console.error('Error al obtener sedes:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * POST /sedes
 */
const crearSede = async (req, res) => {
  const { nombre, direccion, telefono } = req.body;
  if (!nombre || !direccion || !telefono) {
    return respuesta(res, 400, 'Nombre, direccion y telefono son obligatorios', null);
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO sede (nombre, direccion, telefono) VALUES (?, ?, ?)',
      [nombre, direccion, telefono]
    );
    respuesta(res, 201, 'Sede creada', { id: result.insertId, nombre, direccion, telefono });
  } catch (error) {
    console.error('Error al crear sede:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * PUT /sedes/:id
 */
const actualizarSede = async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, telefono } = req.body;
  
  if (!nombre || !direccion || !telefono) {
    return respuesta(res, 400, 'Nombre, direccion y telefono son obligatorios', null);
  }
  try {
    const [result] = await pool.query(
      'UPDATE sede SET nombre = ?, direccion = ?, telefono = ? WHERE id = ?',
      [nombre, direccion, telefono, id]
    );
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Sede no encontrada', null);
    }
    respuesta(res, 200, 'Sede actualizada', { id, nombre, direccion, telefono });
  } catch (error) {
    console.error('Error al actualizar sede:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * DELETE /sedes/:id
 */
const eliminarSede = async (req, res) => {
  const { id } = req.params;
  try {
    // Validar dependencias: usuarios
    const [usuarios] = await pool.query('SELECT id FROM usuario WHERE id_sede = ?', [id]);
    if (usuarios.length > 0) {
      return respuesta(res, 409, 'No se puede eliminar la sede porque hay usuarios asociados a ella', null);
    }

    // Validar dependencias: agenda
    const [agenda] = await pool.query('SELECT id FROM agenda WHERE id_sede = ?', [id]);
    if (agenda.length > 0) {
      return respuesta(res, 409, 'No se puede eliminar la sede porque tiene registros en la agenda', null);
    }

    const [result] = await pool.query('DELETE FROM sede WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Sede no encontrada', null);
    }
    respuesta(res, 200, 'Sede eliminada', null);
  } catch (error) {
    console.error('Error al eliminar sede:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { obtenerSedes, crearSede, actualizarSede, eliminarSede };
