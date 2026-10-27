const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /pacientes/buscar?dni=&apellido=&page=&pageSize=
 * Busca pacientes por DNI (match exacto) o apellido (parcial). Sin filtro,
 * devuelve el listado completo de pacientes paginado, del más nuevo al más
 * viejo. Accesible para operador, médico y admin.
 */
const buscarPacientes = async (req, res) => {
  const { dni, apellido } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
  const offset = (page - 1) * pageSize;

  try {
    let where = ` WHERE u.rol = 'paciente'`;
    const params = [];

    if (dni) {
      where += ' AND u.dni = ?';
      params.push(dni);
    }
    if (apellido) {
      where += ' AND u.apellido LIKE ?';
      params.push(`%${apellido}%`);
    }

    const [totalRows] = await pool.query(`SELECT COUNT(*) AS total FROM usuario u${where}`, params);
    const total = totalRows[0].total;

    const [pacientes] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono, u.fecha_nacimiento,
              u.id_cobertura, c.nombre AS cobertura
       FROM usuario u
       LEFT JOIN cobertura c ON c.id = u.id_cobertura
       ${where}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    respuesta(res, 200, 'ok', { items: pacientes, total, page, pageSize });
  } catch (error) {
    console.error('Error al buscar pacientes:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { buscarPacientes };
