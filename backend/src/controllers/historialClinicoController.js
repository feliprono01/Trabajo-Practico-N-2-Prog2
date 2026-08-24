const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

// ============================================================
// POST /historial-clinico
// Registra diagnóstico, tratamiento y observaciones
// ============================================================
const altaHistorial = async (req, res) => {
  const { id_turno, diagnostico, tratamiento, observaciones } = req.body;
  const usuarioAuth = req.usuario; // Médico

  if (!id_turno || !diagnostico) {
    return respuesta(res, 400, 'Faltan campos obligatorios (id_turno, diagnostico)', null);
  }

  try {
    // 1. Validar que el turno exista, esté atendido y pertenezca a este médico
    const [turnos] = await pool.query(
      `SELECT t.id_paciente, t.estado, a.id_medico 
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       WHERE t.id = ?`,
      [id_turno]
    );

    if (turnos.length === 0) {
      return respuesta(res, 404, 'Turno no encontrado', null);
    }

    const turno = turnos[0];

    if (turno.estado !== 'atendido') {
      return respuesta(res, 400, 'El turno debe estar atendido para cargar el historial', null);
    }

    if (turno.id_medico !== usuarioAuth.id) {
      return respuesta(res, 403, 'No podés registrar historial de un turno que no atendiste', null);
    }

    // 2. Verificar que no exista ya un historial para este turno
    const [existentes] = await pool.query(`SELECT id FROM historial_clinico WHERE id_turno = ?`, [id_turno]);
    
    if (existentes.length > 0) {
      return respuesta(res, 400, 'Este turno ya tiene un historial clínico registrado', null);
    }

    // 3. Insertar historial
    const [resultado] = await pool.query(
      `INSERT INTO historial_clinico (id_turno, id_medico, id_paciente, diagnostico, tratamiento, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_turno, usuarioAuth.id, turno.id_paciente, diagnostico, tratamiento || null, observaciones || null]
    );

    return respuesta(res, 201, 'Historial clínico registrado con éxito', {
      id: resultado.insertId
    });

  } catch (error) {
    console.error('Error en alta de historial:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// GET /historial-clinico/:id_paciente
// Consulta del historial clínico de un paciente
// ============================================================
const consultarHistorial = async (req, res) => {
  const { id_paciente } = req.params;
  const usuarioAuth = req.usuario;

  try {
    // 1. Validación de roles y permisos
    if (usuarioAuth.rol === 'paciente') {
      // El paciente solo puede ver su propio historial
      if (Number(usuarioAuth.id) !== Number(id_paciente)) {
        return respuesta(res, 403, 'No tenés permisos para ver el historial de otro paciente', null);
      }
    }

    // 2. Armar la consulta dependiendo del rol
    let query = `
      SELECT h.id, h.diagnostico, h.tratamiento, h.observaciones, h.fecha_registro,
             m.nombre AS medico_nombre, m.apellido AS medico_apellido,
             e.descripcion AS especialidad, t.fecha AS fecha_turno
      FROM historial_clinico h
      JOIN usuario m ON h.id_medico = m.id
      JOIN turno t ON h.id_turno = t.id
      JOIN agenda a ON t.id_agenda = a.id
      JOIN especialidad e ON a.id_especialidad = e.id
      WHERE h.id_paciente = ?
    `;
    let queryParams = [id_paciente];

    if (usuarioAuth.rol === 'medico') {
      // El médico solo ve registros de los turnos que él mismo atendió
      query += ` AND h.id_medico = ?`;
      queryParams.push(usuarioAuth.id);
    }

    query += ` ORDER BY h.fecha_registro DESC`;

    const [historial] = await pool.query(query, queryParams);

    return respuesta(res, 200, 'ok', historial);

  } catch (error) {
    console.error('Error al consultar historial:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = {
  altaHistorial,
  consultarHistorial
};
