const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

const getTurnosPorEspecialidad = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    let query = `
      SELECT e.descripcion as especialidad, COUNT(t.id) as cantidad
      FROM turno t
      JOIN agenda a ON t.id_agenda = a.id
      JOIN especialidad e ON a.id_especialidad = e.id
      WHERE 1=1
    `;
    const params = [];

    if (fechaDesde) {
      query += ' AND t.fecha >= ?';
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      query += ' AND t.fecha <= ?';
      params.push(fechaHasta);
    }

    query += ' GROUP BY e.id ORDER BY cantidad DESC';

    const [resultados] = await pool.query(query, params);
    return respuesta(res, 200, 'ok', resultados);
  } catch (error) {
    console.error('Error en reporte turnos por especialidad:', error);
    return respuesta(res, 500, 'Error al generar el reporte', null);
  }
};

const getTurnosPorSede = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    let query = `
      SELECT s.nombre as sede, COUNT(t.id) as cantidad
      FROM turno t
      JOIN agenda a ON t.id_agenda = a.id
      JOIN sede s ON a.id_sede = s.id
      WHERE 1=1
    `;
    const params = [];

    if (fechaDesde) {
      query += ' AND t.fecha >= ?';
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      query += ' AND t.fecha <= ?';
      params.push(fechaHasta);
    }

    query += ' GROUP BY s.id ORDER BY cantidad DESC';

    const [resultados] = await pool.query(query, params);
    return respuesta(res, 200, 'ok', resultados);
  } catch (error) {
    console.error('Error en reporte turnos por sede:', error);
    return respuesta(res, 500, 'Error al generar el reporte', null);
  }
};

const getRankingMedicos = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    let query = `
      SELECT u.nombre, u.apellido, COUNT(t.id) as cantidad_atendidos
      FROM turno t
      JOIN agenda a ON t.id_agenda = a.id
      JOIN usuario u ON a.id_medico = u.id
      WHERE t.estado = 'atendido'
    `;
    const params = [];

    if (fechaDesde) {
      query += ' AND t.fecha >= ?';
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      query += ' AND t.fecha <= ?';
      params.push(fechaHasta);
    }

    query += ' GROUP BY u.id ORDER BY cantidad_atendidos DESC';

    const [resultados] = await pool.query(query, params);
    return respuesta(res, 200, 'ok', resultados);
  } catch (error) {
    console.error('Error en reporte ranking médicos:', error);
    return respuesta(res, 500, 'Error al generar el reporte', null);
  }
};

const getTasaCancelacion = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    let query = `
      SELECT 
        COUNT(*) as total_turnos,
        SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as cancelados
      FROM turno t
      WHERE 1=1
    `;
    const params = [];

    if (fechaDesde) {
      query += ' AND t.fecha >= ?';
      params.push(fechaDesde);
    }
    if (fechaHasta) {
      query += ' AND t.fecha <= ?';
      params.push(fechaHasta);
    }

    const [rows] = await pool.query(query, params);
    const resultado = rows[0];
    
    const totalTurnos = Number(resultado.total_turnos);
    const cancelados = Number(resultado.cancelados);

    let tasa = 0;
    if (totalTurnos > 0) {
      tasa = (cancelados / totalTurnos) * 100;
    }

    return respuesta(res, 200, 'ok', {
      total_turnos: totalTurnos,
      cancelados: cancelados,
      tasa_cancelacion_porcentaje: parseFloat(tasa.toFixed(2))
    });
  } catch (error) {
    console.error('Error en reporte tasa cancelación:', error);
    return respuesta(res, 500, 'Error al generar el reporte', null);
  }
};

module.exports = {
  getTurnosPorEspecialidad,
  getTurnosPorSede,
  getRankingMedicos,
  getTasaCancelacion
};
