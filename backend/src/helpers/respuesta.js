/**
 * Helper para enviar respuestas HTTP con estructura uniforme.
 *
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {number} codigo - Código de estado HTTP (ej: 200, 400, 401).
 * @param {string} estado - Texto de estado ('ok' o mensaje de error).
 * @param {any} [datos=null] - Datos a retornar (opcional).
 */
const respuesta = (res, codigo, estado, datos = null) => {
  res.status(codigo).json({ codigo, estado, datos });
};

module.exports = respuesta;
