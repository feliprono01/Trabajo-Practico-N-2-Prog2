const pool = require('../database/connection');

const auditoriaMiddleware = (entidad) => {
  return (req, res, next) => {
    // Interceptamos res.json para poder acceder al body de la respuesta si es necesario
    const originalJson = res.json;
    res.json = function (body) {
      res.locals.body = body;
      return originalJson.call(this, body);
    };

    res.on('finish', async () => {
      // Solo auditar si la petición fue exitosa y es de modificación
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
        
        let accion = '';
        if (req.method === 'POST') accion = 'ALTA';
        else if (req.method === 'DELETE') accion = 'BAJA';
        else accion = 'MODIFICACION';

        // Intentar deducir el ID de la entidad afectada
        let id_entidad = req.params.id || null;
        
        // Si fue un alta, a veces el ID viene en la respuesta
        if (accion === 'ALTA' && res.locals.body && res.locals.body.datos) {
           if (res.locals.body.datos.insertId) {
               id_entidad = res.locals.body.datos.insertId;
           } else if (res.locals.body.datos.id) {
               id_entidad = res.locals.body.datos.id;
           }
        }

        let id_usuario = req.usuario ? req.usuario.id : null;
        
        // Si no hay usuario en req (ej. registro público de paciente), y la entidad es usuario, el que hace la acción es él mismo
        if (!id_usuario && entidad === 'usuario' && accion === 'ALTA') {
          id_usuario = id_entidad;
        }

        if (!id_usuario) return; // Si no hay usuario y no se pudo deducir, no logueamos

        const detalle = `Se realizó ${accion} en la entidad ${entidad}${id_entidad ? ` (ID: ${id_entidad})` : ''}`;

        try {
          await pool.query(
            'INSERT INTO log_auditoria (id_usuario, accion, entidad, id_entidad, detalle) VALUES (?, ?, ?, ?, ?)',
            [id_usuario, accion, entidad, id_entidad || null, detalle]
          );
        } catch (error) {
          console.error('Error al guardar log de auditoría:', error);
        }
      }
    });

    next();
  };
};

module.exports = auditoriaMiddleware;
