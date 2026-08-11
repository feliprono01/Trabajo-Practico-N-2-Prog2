const jwt = require('jsonwebtoken');
const respuesta = require('../helpers/respuesta');

// ============================================================
// verificarToken
// Valida que el JWT sea válido y no esté vencido.
// Si es válido, adjunta el payload a req.usuario.
// ============================================================
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return respuesta(res, 401, 'Token no proporcionado', null);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return respuesta(res, 401, 'El token ha expirado', null);
    }
    return respuesta(res, 401, 'Token inválido', null);
  }
};

// ============================================================
// verificarRol
// Factory que recibe roles permitidos y devuelve un middleware.
// Debe usarse DESPUÉS de verificarToken.
// ============================================================
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return respuesta(res, 401, 'No autenticado', null);
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return respuesta(res, 403, 'No tenés permisos para acceder a este recurso', null);
    }

    next();
  };
};

module.exports = { verificarToken, verificarRol };
