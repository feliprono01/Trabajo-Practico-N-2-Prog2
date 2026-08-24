const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

// ============================================================
// Función interna para crear notificaciones
// No es un endpoint, se importa en otros controladores
// ============================================================
const crearNotificacion = async (id_usuario, tipo, mensaje) => {
  try {
    await pool.query(
      `INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (?, ?, ?)`,
      [id_usuario, tipo, mensaje]
    );
  } catch (error) {
    console.error('Error al crear notificación interna:', error.message);
  }
};

// ============================================================
// GET /notificaciones
// Lista las notificaciones del usuario autenticado
// ============================================================
const listarNotificaciones = async (req, res) => {
  const { id } = req.usuario; // Obtenido del token

  try {
    const [notificaciones] = await pool.query(
      `SELECT id, tipo, mensaje, leida, fecha 
       FROM notificacion 
       WHERE id_usuario = ? 
       ORDER BY fecha DESC`,
      [id]
    );

    return respuesta(res, 200, 'ok', notificaciones);
  } catch (error) {
    console.error('Error al listar notificaciones:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// PUT /notificaciones/:id/leida
// Marca una notificación como leída
// ============================================================
const marcarLeida = async (req, res) => {
  const { id: id_notificacion } = req.params;
  const { id: id_usuario } = req.usuario;

  try {
    // Verificar que la notificación exista y pertenezca al usuario
    const [notificacion] = await pool.query(
      `SELECT id FROM notificacion WHERE id = ? AND id_usuario = ?`,
      [id_notificacion, id_usuario]
    );

    if (notificacion.length === 0) {
      return respuesta(res, 404, 'Notificación no encontrada o no pertenece al usuario', null);
    }

    // Actualizar estado a leída
    await pool.query(
      `UPDATE notificacion SET leida = 1 WHERE id = ?`,
      [id_notificacion]
    );

    return respuesta(res, 200, 'ok', { id: Number(id_notificacion), leida: 1 });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = {
  crearNotificacion,
  listarNotificaciones,
  marcarLeida
};
