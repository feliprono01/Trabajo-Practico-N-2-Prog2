const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

// Duración de cada turno en minutos. Debe ser coherente con la validación
// de superposición de altaTurno (turnoController.js), que trabaja por horario exacto.
const DURACION_TURNO_MINUTOS = 30;

const sumarMinutos = (horaStr, minutos) => {
  const [h, m] = horaStr.split(':').map(Number);
  const total = h * 60 + m + minutos;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

// Un médico no puede tener dos rangos horarios superpuestos el mismo día,
// sin importar la sede (no puede atender en dos lugares a la vez).
const buscarRangoSuperpuesto = async (idMedico, fecha, horaEntrada, horaSalida, idExcluir) => {
  let query = `
    SELECT a.id, a.hora_entrada, a.hora_salida, s.nombre AS sede
    FROM agenda a
    JOIN sede s ON s.id = a.id_sede
    WHERE a.id_medico = ? AND a.fecha = ? AND a.hora_entrada < ? AND a.hora_salida > ?`;
  const params = [idMedico, fecha, horaSalida, horaEntrada];
  if (idExcluir) {
    query += ' AND a.id <> ?';
    params.push(idExcluir);
  }
  const [filas] = await pool.query(query, params);
  return filas[0] ?? null;
};

/**
 * GET /agenda
 * Lista la agenda, opcionalmente filtrando por id_medico, id_sede y fecha.
 * Enriquecida con nombre/apellido del médico y descripción de especialidad/sede.
 */
const obtenerAgenda = async (req, res) => {
  const { id_medico, id_sede, fecha } = req.query;
  const usuarioLogueado = req.usuario;

  try {
    let query = `
      SELECT a.id, a.hora_entrada, a.hora_salida, a.fecha,
             a.id_medico, m.nombre AS medico_nombre, m.apellido AS medico_apellido,
             a.id_especialidad, e.descripcion AS especialidad,
             a.id_sede, s.nombre AS sede
      FROM agenda a
      JOIN usuario m ON m.id = a.id_medico
      JOIN especialidad e ON e.id = a.id_especialidad
      JOIN sede s ON s.id = a.id_sede
      WHERE 1=1`;
    const params = [];

    if (id_medico) {
      query += ' AND a.id_medico = ?';
      params.push(id_medico);
    }
    if (id_sede) {
      query += ' AND a.id_sede = ?';
      params.push(id_sede);
    }
    if (fecha) {
      query += ' AND a.fecha = ?';
      params.push(fecha);
    }
    query += ' ORDER BY a.fecha ASC, a.hora_entrada ASC';

    const [agenda] = await pool.query(query, params);

    // Filtrar la respuesta si es medico (solo ve lo suyo)
    if (usuarioLogueado.rol === 'medico') {
      const agendaPropia = agenda.filter((a) => a.id_medico == usuarioLogueado.id);
      return respuesta(res, 200, 'ok', agendaPropia);
    }

    respuesta(res, 200, 'ok', agenda);
  } catch (error) {
    console.error('Error al obtener agenda:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * POST /agenda
 */
const crearAgenda = async (req, res) => {
  const { hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede } = req.body;
  const usuarioLogueado = req.usuario;

  if (!hora_entrada || !hora_salida || !fecha || !id_medico || !id_especialidad || !id_sede) {
    return respuesta(res, 400, 'Todos los campos son obligatorios', null);
  }

  if (hora_salida <= hora_entrada) {
    return respuesta(res, 400, 'La hora de salida debe ser posterior a la hora de entrada', null);
  }

  // Validación de rol médico: solo puede crear su propia agenda
  if (usuarioLogueado.rol === 'medico' && parseInt(id_medico) !== parseInt(usuarioLogueado.id)) {
    return respuesta(res, 403, 'Un médico solo puede gestionar su propia agenda', null);
  }

  // Validación de rol operador: solo puede crear agenda en su propia sede
  if (usuarioLogueado.rol === 'operador' && parseInt(id_sede) !== parseInt(usuarioLogueado.id_sede)) {
    return respuesta(res, 403, 'Un operador solo puede gestionar la agenda de su propia sede', null);
  }

  try {
    const superpuesto = await buscarRangoSuperpuesto(id_medico, fecha, hora_entrada, hora_salida);
    if (superpuesto) {
      return respuesta(
        res,
        409,
        `El médico ya tiene un rango horario que se superpone (${superpuesto.hora_entrada} - ${superpuesto.hora_salida} en ${superpuesto.sede})`,
        null
      );
    }

    const [result] = await pool.query(
      'INSERT INTO agenda (hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede) VALUES (?, ?, ?, ?, ?, ?)',
      [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede]
    );
    respuesta(res, 201, 'Agenda creada', { id: result.insertId, hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede });
  } catch (error) {
    console.error('Error al crear agenda:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * PUT /agenda/:id
 */
const actualizarAgenda = async (req, res) => {
  const { id } = req.params;
  const { hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede } = req.body;
  const usuarioLogueado = req.usuario;

  if (!hora_entrada || !hora_salida || !fecha || !id_medico || !id_especialidad || !id_sede) {
    return respuesta(res, 400, 'Todos los campos son obligatorios', null);
  }

  if (hora_salida <= hora_entrada) {
    return respuesta(res, 400, 'La hora de salida debe ser posterior a la hora de entrada', null);
  }

  if (usuarioLogueado.rol === 'medico' && parseInt(id_medico) !== parseInt(usuarioLogueado.id)) {
    return respuesta(res, 403, 'Un médico solo puede gestionar su propia agenda', null);
  }

  try {
    const [registroActual] = await pool.query('SELECT id_medico, id_sede FROM agenda WHERE id = ?', [id]);
    if (registroActual.length === 0) {
      return respuesta(res, 404, 'Agenda no encontrada', null);
    }

    // Verificar que la agenda original sea del médico si el rol es médico
    if (usuarioLogueado.rol === 'medico' && parseInt(registroActual[0].id_medico) !== parseInt(usuarioLogueado.id)) {
      return respuesta(res, 403, 'No puedes modificar la agenda de otro médico', null);
    }

    // El operador solo puede modificar agenda de su propia sede (la actual y la nueva)
    if (usuarioLogueado.rol === 'operador') {
      if (parseInt(registroActual[0].id_sede) !== parseInt(usuarioLogueado.id_sede) || parseInt(id_sede) !== parseInt(usuarioLogueado.id_sede)) {
        return respuesta(res, 403, 'Un operador solo puede gestionar la agenda de su propia sede', null);
      }
    }

    const superpuesto = await buscarRangoSuperpuesto(id_medico, fecha, hora_entrada, hora_salida, id);
    if (superpuesto) {
      return respuesta(
        res,
        409,
        `El médico ya tiene un rango horario que se superpone (${superpuesto.hora_entrada} - ${superpuesto.hora_salida} en ${superpuesto.sede})`,
        null
      );
    }

    // No permitir que queden turnos confirmados fuera del nuevo rango horario
    const [turnosConfirmados] = await pool.query(
      `SELECT hora FROM turno WHERE id_agenda = ? AND estado = 'confirmado'`,
      [id]
    );
    const fueraDeRango = turnosConfirmados.some(
      (t) => t.hora < hora_entrada || t.hora >= hora_salida
    );
    if (fueraDeRango) {
      return respuesta(res, 409, 'No se puede modificar el rango horario: hay turnos confirmados que quedarían fuera de él', null);
    }

    const [result] = await pool.query(
      'UPDATE agenda SET hora_entrada = ?, hora_salida = ?, fecha = ?, id_medico = ?, id_especialidad = ?, id_sede = ? WHERE id = ?',
      [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede, id]
    );

    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Agenda no encontrada', null);
    }
    respuesta(res, 200, 'Agenda actualizada', { id, hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede });
  } catch (error) {
    console.error('Error al actualizar agenda:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * DELETE /agenda/:id
 */
const eliminarAgenda = async (req, res) => {
  const { id } = req.params;
  const usuarioLogueado = req.usuario;

  try {
    const [registroActual] = await pool.query('SELECT id_medico, id_sede FROM agenda WHERE id = ?', [id]);
    if (registroActual.length === 0) {
      return respuesta(res, 404, 'Agenda no encontrada', null);
    }

    if (usuarioLogueado.rol === 'medico' && parseInt(registroActual[0].id_medico) !== parseInt(usuarioLogueado.id)) {
      return respuesta(res, 403, 'No puedes eliminar la agenda de otro médico', null);
    }

    if (usuarioLogueado.rol === 'operador' && parseInt(registroActual[0].id_sede) !== parseInt(usuarioLogueado.id_sede)) {
      return respuesta(res, 403, 'Un operador solo puede gestionar la agenda de su propia sede', null);
    }

    // Validar dependencias: solo bloquea si hay turnos confirmados (los cancelados no impiden el borrado)
    const [turnos] = await pool.query(
      `SELECT id FROM turno WHERE id_agenda = ? AND estado = 'confirmado'`,
      [id]
    );
    if (turnos.length > 0) {
      return respuesta(res, 409, 'No se puede eliminar la agenda porque tiene turnos confirmados asociados', null);
    }

    const [result] = await pool.query('DELETE FROM agenda WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return respuesta(res, 404, 'Agenda no encontrada', null);
    }
    respuesta(res, 200, 'Agenda eliminada', null);
  } catch (error) {
    console.error('Error al eliminar agenda:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * GET /agenda/fechas-disponibles?id_medico&id_especialidad&id_sede
 * Devuelve las fechas (hoy en adelante) en las que el médico tiene agenda
 * cargada para esa especialidad y sede. Pensado para el wizard de turno.
 */
const obtenerFechasDisponibles = async (req, res) => {
  const { id_medico, id_especialidad, id_sede } = req.query;

  if (!id_medico || !id_especialidad || !id_sede) {
    return respuesta(res, 400, 'id_medico, id_especialidad e id_sede son obligatorios', null);
  }

  try {
    const [filas] = await pool.query(
      `SELECT DISTINCT fecha FROM agenda
       WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha >= CURDATE()
       ORDER BY fecha ASC`,
      [id_medico, id_especialidad, id_sede]
    );
    respuesta(res, 200, 'ok', filas.map((f) => f.fecha));
  } catch (error) {
    console.error('Error al obtener fechas disponibles:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * GET /agenda/horarios-disponibles?id_medico&fecha&id_especialidad&id_sede
 * Devuelve los horarios libres: los rangos de agenda de ese día/especialidad/sede
 * partidos en turnos de DURACION_TURNO_MINUTOS, menos los turnos ya confirmados.
 */
const obtenerHorariosDisponibles = async (req, res) => {
  const { id_medico, fecha, id_especialidad, id_sede } = req.query;

  if (!id_medico || !fecha || !id_especialidad || !id_sede) {
    return respuesta(res, 400, 'id_medico, fecha, id_especialidad e id_sede son obligatorios', null);
  }

  try {
    const [rangos] = await pool.query(
      `SELECT hora_entrada, hora_salida FROM agenda
       WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha = ?`,
      [id_medico, id_especialidad, id_sede, fecha]
    );

    if (rangos.length === 0) {
      return respuesta(res, 200, 'ok', []);
    }

    const [ocupados] = await pool.query(
      `SELECT t.hora
       FROM turno t
       JOIN agenda a ON t.id_agenda = a.id
       WHERE a.id_medico = ? AND t.fecha = ? AND t.estado != 'cancelado'`,
      [id_medico, fecha]
    );
    const horasOcupadas = new Set(ocupados.map((o) => o.hora));

    const horarios = [];
    for (const rango of rangos) {
      let actual = rango.hora_entrada;
      while (actual < rango.hora_salida) {
        if (!horasOcupadas.has(actual)) {
          horarios.push(actual);
        }
        actual = sumarMinutos(actual, DURACION_TURNO_MINUTOS);
      }
    }

    respuesta(res, 200, 'ok', horarios);
  } catch (error) {
    console.error('Error al obtener horarios disponibles:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = {
  obtenerAgenda,
  crearAgenda,
  actualizarAgenda,
  eliminarAgenda,
  obtenerFechasDisponibles,
  obtenerHorariosDisponibles,
};
