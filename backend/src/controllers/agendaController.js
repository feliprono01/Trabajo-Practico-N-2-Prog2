const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

/**
 * GET /agenda
 * Lista la agenda, opcionalmente filtrando por id_medico, id_sede y fecha
 */
const obtenerAgenda = async (req, res) => {
  const { id_medico, id_sede, fecha } = req.query;
  const usuarioLogueado = req.usuario;

  try {
    let query = 'SELECT * FROM agenda WHERE 1=1';
    const params = [];

    if (id_medico) {
      query += ' AND id_medico = ?';
      params.push(id_medico);
    }
    if (id_sede) {
      query += ' AND id_sede = ?';
      params.push(id_sede);
    }
    if (fecha) {
      query += ' AND fecha = ?';
      params.push(fecha);
    }

    const [agenda] = await pool.query(query, params);

    // Filtrar la respuesta si es medico (solo ve lo suyo)
    if (usuarioLogueado.rol === 'medico') {
      const agendaPropia = agenda.filter(a => a.id_medico == usuarioLogueado.id);
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

  // Validación de rol médico: solo puede crear su propia agenda
  if (usuarioLogueado.rol === 'medico' && parseInt(id_medico) !== parseInt(usuarioLogueado.id)) {
    return respuesta(res, 403, 'Un médico solo puede gestionar su propia agenda', null);
  }

  try {
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

  if (usuarioLogueado.rol === 'medico' && parseInt(id_medico) !== parseInt(usuarioLogueado.id)) {
    return respuesta(res, 403, 'Un médico solo puede gestionar su propia agenda', null);
  }

  try {
    // Verificar que la agenda original sea del médico si el rol es médico
    if (usuarioLogueado.rol === 'medico') {
      const [registroActual] = await pool.query('SELECT id_medico FROM agenda WHERE id = ?', [id]);
      if (registroActual.length === 0) {
        return respuesta(res, 404, 'Agenda no encontrada', null);
      }
      if (parseInt(registroActual[0].id_medico) !== parseInt(usuarioLogueado.id)) {
        return respuesta(res, 403, 'No puedes modificar la agenda de otro médico', null);
      }
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
    if (usuarioLogueado.rol === 'medico') {
      const [registroActual] = await pool.query('SELECT id_medico FROM agenda WHERE id = ?', [id]);
      if (registroActual.length === 0) {
        return respuesta(res, 404, 'Agenda no encontrada', null);
      }
      if (parseInt(registroActual[0].id_medico) !== parseInt(usuarioLogueado.id)) {
        return respuesta(res, 403, 'No puedes eliminar la agenda de otro médico', null);
      }
    }

    // Validar dependencias: turnos
    const [turnos] = await pool.query('SELECT id FROM turno WHERE id_agenda = ?', [id]);
    if (turnos.length > 0) {
      return respuesta(res, 409, 'No se puede eliminar la agenda porque tiene turnos asociados', null);
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

module.exports = { obtenerAgenda, crearAgenda, actualizarAgenda, eliminarAgenda };
