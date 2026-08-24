const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');
const { crearNotificacion } = require('./notificacionController');

// Helper para formatear fechas a DD/MM/YYYY en las notificaciones
const formatearFecha = (fecha) => {
  if (fecha instanceof Date) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
  }
  // String "YYYY-MM-DD" → "DD/MM/YYYY"
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

// ============================================================
// POST /turnos
// Alta de turno por un paciente (o en su representación)
// ============================================================
const altaTurno = async (req, res) => {
  // Nota: Si un operador saca un turno por un paciente, req.body debería incluir id_paciente.
  // Asumiremos por defecto que el usuario autenticado es el paciente,
  // a menos que venga id_paciente y el usuario sea operador.
  const { id_especialidad, id_sede, id_medico, fecha, hora, nota, id_paciente_req } = req.body;
  const usuarioAuth = req.usuario;

  if (!id_especialidad || !id_sede || !id_medico || !fecha || !hora || !nota) {
    return respuesta(res, 400, 'Faltan campos obligatorios', null);
  }

  let id_paciente = usuarioAuth.rol === 'paciente' ? usuarioAuth.id : id_paciente_req;

  if (!id_paciente) {
    return respuesta(res, 400, 'Falta indicar el id_paciente (requerido si no sos paciente)', null);
  }

  try {
    // 1. Obtener la cobertura del paciente (no se puede pisar)
    const [pacientes] = await pool.query('SELECT id_cobertura FROM usuario WHERE id = ?', [id_paciente]);
    if (pacientes.length === 0) {
      return respuesta(res, 404, 'Paciente no encontrado', null);
    }
    const id_cobertura = pacientes[0].id_cobertura;
    if (!id_cobertura) {
      return respuesta(res, 400, 'El paciente no tiene una cobertura registrada', null);
    }

    // 2. Verificar agenda del médico para esa fecha
    const [agendas] = await pool.query(
      `SELECT id, hora_entrada, hora_salida 
       FROM agenda 
       WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha = ?`,
      [id_medico, id_especialidad, id_sede, fecha]
    );

    if (agendas.length === 0) {
      return respuesta(res, 400, 'El médico no tiene agenda disponible para esos datos', null);
    }

    const agenda = agendas[0];

    // 3. Validar rango horario
    if (hora < agenda.hora_entrada || hora >= agenda.hora_salida) {
      return respuesta(res, 400, 'El horario solicitado está fuera de la agenda del médico', null);
    }

    // 4. Validar superposición (ya existe un turno confirmado/atendido en ese horario)
    const [superpuestos] = await pool.query(
      `SELECT id FROM turno WHERE id_agenda = ? AND fecha = ? AND hora = ? AND estado != 'cancelado'`,
      [agenda.id, fecha, hora]
    );

    if (superpuestos.length > 0) {
      return respuesta(res, 400, 'El horario solicitado ya se encuentra ocupado', null);
    }

    // 5. Crear el turno
    const [resultado] = await pool.query(
      `INSERT INTO turno (nota, id_agenda, fecha, hora, id_paciente, id_cobertura, estado) 
       VALUES (?, ?, ?, ?, ?, ?, 'confirmado')`,
      [nota, agenda.id, fecha, hora, id_paciente, id_cobertura]
    );

    // 6. Generar notificación
    const mensaje = `Tu turno para el ${formatearFecha(fecha)} a las ${hora} hs fue confirmado.`;
    await crearNotificacion(id_paciente, 'turno_confirmado', mensaje);

    return respuesta(res, 201, 'Turno creado con éxito', {
      id: resultado.insertId,
      estado: 'confirmado'
    });

  } catch (error) {
    console.error('Error en alta de turno:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// PUT /turnos/:id/cancelar
// Cancelación de turno
// ============================================================
const cancelarTurno = async (req, res) => {
  const { id } = req.params;
  const usuarioAuth = req.usuario;

  try {
    // 1. Obtener datos del turno
    const [turnos] = await pool.query(
      `SELECT t.id, t.id_paciente, t.fecha, t.hora, t.estado, a.id_sede, a.id_medico 
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       WHERE t.id = ?`,
      [id]
    );

    if (turnos.length === 0) {
      return respuesta(res, 404, 'Turno no encontrado', null);
    }

    const turno = turnos[0];

    // Ya cancelado
    if (turno.estado === 'cancelado') {
      return respuesta(res, 400, 'El turno ya se encuentra cancelado', null);
    }

    // 2. Validación de roles y permisos
    if (usuarioAuth.rol === 'paciente') {
      if (turno.id_paciente !== usuarioAuth.id) {
        return respuesta(res, 403, 'No podés cancelar un turno que no te pertenece', null);
      }
    } else if (usuarioAuth.rol === 'operador' || usuarioAuth.rol === 'medico') {
      if (turno.id_sede !== usuarioAuth.id_sede) {
        return respuesta(res, 403, 'No podés cancelar turnos de otra sede', null);
      }
    }

    // 3. Cancelar turno
    await pool.query(`UPDATE turno SET estado = 'cancelado' WHERE id = ?`, [id]);

    // 4. Generar notificación al paciente
    const mensaje = `Tu turno del ${formatearFecha(turno.fecha)} a las ${turno.hora} hs fue cancelado.`;
    await crearNotificacion(turno.id_paciente, 'turno_cancelado', mensaje);
    
    // Opcional: Notificar al médico si lo canceló el paciente/operador
    if (usuarioAuth.rol !== 'medico') {
      const msgMedico = `Se canceló un turno de tu agenda el ${formatearFecha(turno.fecha)} a las ${turno.hora}.`;
      await crearNotificacion(turno.id_medico, 'turno_cancelado', msgMedico);
    }

    return respuesta(res, 200, 'Turno cancelado con éxito', { id: turno.id, estado: 'cancelado' });

  } catch (error) {
    console.error('Error en cancelar turno:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// PUT /turnos/:id/atender
// ============================================================
const atenderTurno = async (req, res) => {
  const { id } = req.params;
  const usuarioAuth = req.usuario;

  try {
    const [turnos] = await pool.query(
      `SELECT t.id, t.id_paciente, t.fecha, t.hora, t.estado, a.id_sede, a.id_medico 
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       WHERE t.id = ?`,
      [id]
    );

    if (turnos.length === 0) {
      return respuesta(res, 404, 'Turno no encontrado', null);
    }

    const turno = turnos[0];

    // Validar estado
    if (turno.estado !== 'confirmado') {
      return respuesta(res, 400, 'Solo se pueden atender turnos confirmados', null);
    }

    // Validar rol (Solo médicos de la misma sede y que sean el médico de la agenda,
    // o al menos de la misma sede, asumo que debe ser el médico de ese turno).
    if (turno.id_medico !== usuarioAuth.id) {
       return respuesta(res, 403, 'Solo el médico asignado puede atender el turno', null);
    }

    await pool.query(`UPDATE turno SET estado = 'atendido' WHERE id = ?`, [id]);

    const mensaje = `Tu turno del ${formatearFecha(turno.fecha)} a las ${turno.hora} hs fue marcado como atendido.`;
    await crearNotificacion(turno.id_paciente, 'turno_atendido', mensaje);

    return respuesta(res, 200, 'Turno atendido', { id: turno.id, estado: 'atendido' });

  } catch (error) {
    console.error('Error en atender turno:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// GET /turnos/mis-turnos (Para el paciente)
// ============================================================
const listarTurnosPaciente = async (req, res) => {
  const usuarioAuth = req.usuario;

  try {
    const [turnos] = await pool.query(
      `SELECT t.id, t.fecha, t.hora, t.estado, t.nota, e.descripcion AS especialidad, 
              s.nombre AS sede, m.nombre AS medico_nombre, m.apellido AS medico_apellido
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       JOIN especialidad e ON a.id_especialidad = e.id
       JOIN sede s ON a.id_sede = s.id
       JOIN usuario m ON a.id_medico = m.id
       WHERE t.id_paciente = ?
       ORDER BY t.fecha ASC, t.hora ASC`,
      [usuarioAuth.id]
    );

    return respuesta(res, 200, 'ok', turnos);
  } catch (error) {
    console.error('Error al listar turnos del paciente:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// GET /turnos/medico (Para el médico)
// ============================================================
const listarTurnosMedico = async (req, res) => {
  const usuarioAuth = req.usuario;
  const { fecha } = req.query;

  if (!fecha) {
    return respuesta(res, 400, 'Se requiere la fecha para filtrar (query param: ?fecha=YYYY-MM-DD)', null);
  }

  try {
    const [turnos] = await pool.query(
      `SELECT t.id, t.fecha, t.hora, t.estado, t.nota, p.nombre AS paciente_nombre, 
              p.apellido AS paciente_apellido, p.dni AS paciente_dni
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       JOIN usuario p ON t.id_paciente = p.id
       WHERE a.id_medico = ? AND t.fecha = ?
       ORDER BY t.hora ASC`,
      [usuarioAuth.id, fecha]
    );

    return respuesta(res, 200, 'ok', turnos);
  } catch (error) {
    console.error('Error al listar turnos del médico:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// GET /turnos/sede (Para el operador)
// ============================================================
const listarTurnosSede = async (req, res) => {
  const usuarioAuth = req.usuario;
  const { fecha } = req.query;

  if (!fecha) {
    return respuesta(res, 400, 'Se requiere la fecha para filtrar (query param: ?fecha=YYYY-MM-DD)', null);
  }

  try {
    const [turnos] = await pool.query(
      `SELECT t.id, t.fecha, t.hora, t.estado, m.nombre AS medico_nombre, m.apellido AS medico_apellido,
              p.nombre AS paciente_nombre, p.apellido AS paciente_apellido
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       JOIN usuario m ON a.id_medico = m.id
       JOIN usuario p ON t.id_paciente = p.id
       WHERE a.id_sede = ? AND t.fecha = ?
       ORDER BY t.hora ASC`,
      [usuarioAuth.id_sede, fecha]
    );

    return respuesta(res, 200, 'ok', turnos);
  } catch (error) {
    console.error('Error al listar turnos de la sede:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = {
  altaTurno,
  cancelarTurno,
  atenderTurno,
  listarTurnosPaciente,
  listarTurnosMedico,
  listarTurnosSede
};
