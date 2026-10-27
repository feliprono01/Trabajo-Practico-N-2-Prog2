const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

const obtenerAuditoria = async (req, res) => {
  try {
    const { id_usuario, entidad, fechaDesde, fechaHasta } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
    const offset = (page - 1) * pageSize;

    let where = ' WHERE 1=1';
    const params = [];

    if (id_usuario) {
      where += ' AND l.id_usuario = ?';
      params.push(id_usuario);
    }

    if (entidad) {
      where += ' AND l.entidad = ?';
      params.push(entidad);
    }

    if (fechaDesde) {
      where += ' AND l.fecha >= ?';
      params.push(`${fechaDesde} 00:00:00`);
    }

    if (fechaHasta) {
      where += ' AND l.fecha <= ?';
      params.push(`${fechaHasta} 23:59:59`);
    }

    const [totalRows] = await pool.query(`SELECT COUNT(*) AS total FROM log_auditoria l${where}`, params);
    const total = totalRows[0].total;

    const [logs] = await pool.query(
      `SELECT l.id, l.id_usuario, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
              l.accion, l.entidad, l.id_entidad, l.detalle, l.fecha
       FROM log_auditoria l
       LEFT JOIN usuario u ON u.id = l.id_usuario
       ${where}
       ORDER BY l.fecha DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return respuesta(res, 200, 'ok', { items: logs, total, page, pageSize });
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    return respuesta(res, 500, 'Error al obtener logs de auditoría', null);
  }
};

module.exports = {
  obtenerAuditoria,
};
