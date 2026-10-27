const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /pacientes/buscar?dni=&apellido=
 * Busca pacientes por DNI (match exacto) o apellido (parcial).
 * Accesible para operador, médico y admin.
 */
const buscarPacientes = async (req, res) => {
  const { dni, apellido } = req.query;

  if (!dni && !apellido) {
    return respuesta(res, 400, 'Debe indicar dni o apellido para buscar', null);
  }

  try {
    let query = `
      SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono, u.fecha_nacimiento,
             u.id_cobertura, c.nombre AS cobertura
      FROM usuario u
      LEFT JOIN cobertura c ON c.id = u.id_cobertura
      WHERE u.rol = 'paciente'`;
    const params = [];

    if (dni) {
      query += ' AND u.dni = ?';
      params.push(dni);
    }
    if (apellido) {
      query += ' AND u.apellido LIKE ?';
      params.push(`%${apellido}%`);
    }

    query += ' ORDER BY u.apellido ASC, u.nombre ASC LIMIT 50';

    const [pacientes] = await pool.query(query, params);
    respuesta(res, 200, 'ok', pacientes);
  } catch (error) {
    console.error('Error al buscar pacientes:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { buscarPacientes };
