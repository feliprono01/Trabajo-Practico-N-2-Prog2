const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

// ============================================================
// POST /auth/registro
// Registra un nuevo usuario con rol 'paciente'
// ============================================================
const registro = async (req, res) => {
  const { nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono } = req.body;

  // 1. Validar campos requeridos
  if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura) {
    return respuesta(res, 400, 'Faltan campos requeridos: nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura', null);
  }

  try {
    // 2. Verificar que el DNI no esté en uso
    const [porDni] = await pool.query('SELECT id FROM usuario WHERE dni = ?', [dni]);
    if (porDni.length > 0) {
      return respuesta(res, 400, 'El DNI ya está registrado', null);
    }

    // 3. Verificar que el email no esté en uso
    const [porEmail] = await pool.query('SELECT id FROM usuario WHERE email = ?', [email]);
    if (porEmail.length > 0) {
      return respuesta(res, 400, 'El email ya está registrado', null);
    }

    // 4. Verificar que la cobertura exista
    const [cobertura] = await pool.query('SELECT id FROM cobertura WHERE id = ?', [id_cobertura]);
    if (cobertura.length === 0) {
      return respuesta(res, 400, 'La cobertura indicada no existe', null);
    }

    // 5. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 6. Insertar el nuevo usuario como paciente
    const [resultado] = await pool.query(
      `INSERT INTO usuario (nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono, rol, id_sede)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paciente', NULL)`,
      [nombre, apellido, dni, email, passwordHash, fecha_nacimiento, id_cobertura, telefono || '']
    );

    // 7. Responder con los datos del nuevo usuario (sin password)
    return respuesta(res, 201, 'ok', {
      id: resultado.insertId,
      nombre,
      apellido,
      dni,
      email,
      rol: 'paciente',
      id_cobertura,
    });

  } catch (error) {
    console.error('Error en registro:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// POST /auth/login
// Valida credenciales y devuelve un JWT
// ============================================================
const login = async (req, res) => {
  const { dni, password } = req.body;

  // 1. Validar campos requeridos
  if (!dni || !password) {
    return respuesta(res, 400, 'DNI y contraseña son requeridos', null);
  }

  try {
    // 2. Buscar usuario por DNI
    const [usuarios] = await pool.query(
      'SELECT id, nombre, apellido, rol, id_sede, password FROM usuario WHERE dni = ?',
      [dni]
    );

    if (usuarios.length === 0) {
      return respuesta(res, 401, 'DNI o contraseña incorrectos', null);
    }

    const usuario = usuarios[0];

    // 3. Comparar contraseña con el hash
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return respuesta(res, 401, 'DNI o contraseña incorrectos', null);
    }

    // 4. Generar JWT con payload: id, rol, id_sede
    const payload = {
      id: usuario.id,
      rol: usuario.rol,
      id_sede: usuario.id_sede,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // 5. Responder con el token (sin password)
    return respuesta(res, 200, 'ok', {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        id_sede: usuario.id_sede,
      },
    });

  } catch (error) {
    console.error('Error en login:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

// ============================================================
// GET /auth/perfil
// Devuelve los datos del usuario autenticado (sin password).
// Requiere verificarToken aplicado en la ruta.
// ============================================================
const perfil = async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono,
              u.fecha_nacimiento, u.rol, u.id_sede, u.id_cobertura,
              s.nombre AS sede, c.nombre AS cobertura
       FROM usuario u
       LEFT JOIN sede s ON s.id = u.id_sede
       LEFT JOIN cobertura c ON c.id = u.id_cobertura
       WHERE u.id = ?`,
      [req.usuario.id]
    );

    if (usuarios.length === 0) {
      return respuesta(res, 404, 'Usuario no encontrado', null);
    }

    return respuesta(res, 200, 'ok', usuarios[0]);
  } catch (error) {
    console.error('Error en perfil:', error.message);
    return respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { registro, login, perfil };
