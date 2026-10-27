const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /medicos
 * Lista médicos con sus especialidades (nombre, apellido, id; sin otros datos
 * personales). Filtrable por especialidad y por sede (la sede se resuelve
 * contra la agenda, ya que un médico puede atender en más de una).
 * Accesible para cualquier usuario logueado.
 */
const listarMedicos = async (req, res) => {
  const { id_especialidad, id_sede } = req.query;

  try {
    let query = `
      SELECT DISTINCT u.id, u.nombre, u.apellido
      FROM usuario u
      JOIN medico_especialidad me ON me.id_medico = u.id
      WHERE u.rol = 'medico'`;
    const params = [];

    if (id_especialidad) {
      query += ' AND me.id_especialidad = ?';
      params.push(id_especialidad);
    }

    if (id_sede) {
      query += ' AND EXISTS (SELECT 1 FROM agenda a WHERE a.id_medico = u.id AND a.id_sede = ?)';
      params.push(id_sede);
    }

    query += ' ORDER BY u.apellido ASC, u.nombre ASC';

    const [medicos] = await pool.query(query, params);

    if (medicos.length === 0) {
      return respuesta(res, 200, 'ok', []);
    }

    const ids = medicos.map((m) => m.id);
    const [especialidades] = await pool.query(
      `SELECT me.id_medico, e.id, e.descripcion
       FROM medico_especialidad me
       JOIN especialidad e ON e.id = me.id_especialidad
       WHERE me.id_medico IN (?)`,
      [ids]
    );

    const porMedico = {};
    especialidades.forEach((e) => {
      if (!porMedico[e.id_medico]) porMedico[e.id_medico] = [];
      porMedico[e.id_medico].push({ id: e.id, descripcion: e.descripcion });
    });

    const resultado = medicos.map((m) => ({ ...m, especialidades: porMedico[m.id] || [] }));

    respuesta(res, 200, 'ok', resultado);
  } catch (error) {
    console.error('Error al listar médicos:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { listarMedicos };
