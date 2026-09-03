const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

const obtenerAuditoria = async (req, res) => {
  try {
    const { id_usuario, entidad, fechaDesde, fechaHasta } = req.query;
    
    let query = 'SELECT * FROM log_auditoria WHERE 1=1';
    const params = [];

    if (id_usuario) {
      query += ' AND id_usuario = ?';
      params.push(id_usuario);
    }
    
    if (entidad) {
      query += ' AND entidad = ?';
      params.push(entidad);
    }
    
    if (fechaDesde) {
      query += ' AND fecha >= ?';
      params.push(`${fechaDesde} 00:00:00`);
    }
    
    if (fechaHasta) {
      query += ' AND fecha <= ?';
      params.push(`${fechaHasta} 23:59:59`);
    }

    query += ' ORDER BY fecha DESC';

    const [logs] = await pool.query(query, params);
    
    return respuesta(res, 200, 'ok', logs);
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    return respuesta(res, 500, 'Error al obtener logs de auditoría', null);
  }
};

module.exports = {
  obtenerAuditoria
};
