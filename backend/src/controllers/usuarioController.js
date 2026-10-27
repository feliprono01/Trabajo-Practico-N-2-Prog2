const bcrypt = require('bcrypt');
const pool = require('../database/connection');
const respuesta = require('../helpers/respuesta');

const ROLES_GESTIONABLES = ['operador', 'medico', 'admin'];

const adjuntarEspecialidades = async (usuarios) => {
  const idsMedicos = usuarios.filter((u) => u.rol === 'medico').map((u) => u.id);
  if (idsMedicos.length === 0) return usuarios;

  const [filas] = await pool.query(
    `SELECT me.id_medico, e.id, e.descripcion
     FROM medico_especialidad me
     JOIN especialidad e ON e.id = me.id_especialidad
     WHERE me.id_medico IN (?)`,
    [idsMedicos]
  );

  const porMedico = {};
  filas.forEach((f) => {
    if (!porMedico[f.id_medico]) porMedico[f.id_medico] = [];
    porMedico[f.id_medico].push({ id: f.id, descripcion: f.descripcion });
  });

  return usuarios.map((u) => (u.rol === 'medico' ? { ...u, especialidades: porMedico[u.id] || [] } : u));
};

/**
 * GET /usuarios
 * Listado paginado con filtros por nombre, apellido, rol y sede. Solo admin.
 */
const listarUsuarios = async (req, res) => {
  const { nombre, apellido, rol, id_sede } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
  const offset = (page - 1) * pageSize;

  try {
    let where = ' WHERE 1=1';
    const params = [];

    if (nombre) {
      where += ' AND u.nombre LIKE ?';
      params.push(`%${nombre}%`);
    }
    if (apellido) {
      where += ' AND u.apellido LIKE ?';
      params.push(`%${apellido}%`);
    }
    if (rol) {
      where += ' AND u.rol = ?';
      params.push(rol);
    }
    if (id_sede) {
      where += ' AND u.id_sede = ?';
      params.push(id_sede);
    }

    const [totalRows] = await pool.query(`SELECT COUNT(*) AS total FROM usuario u${where}`, params);
    const total = totalRows[0].total;

    const [usuarios] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono, u.fecha_nacimiento,
              u.rol, u.id_sede, s.nombre AS sede, u.id_cobertura, c.nombre AS cobertura
       FROM usuario u
       LEFT JOIN sede s ON s.id = u.id_sede
       LEFT JOIN cobertura c ON c.id = u.id_cobertura
       ${where}
       ORDER BY u.apellido ASC, u.nombre ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const items = await adjuntarEspecialidades(usuarios);

    respuesta(res, 200, 'ok', { items, total, page, pageSize });
  } catch (error) {
    console.error('Error al listar usuarios:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * POST /usuarios
 * Alta de usuarios de tipo operador, médico o administrador (el paciente se
 * da de alta vía /auth/registro). Solo admin.
 */
const crearUsuario = async (req, res) => {
  const { nombre, apellido, dni, email, password, fecha_nacimiento, telefono, rol, id_sede, especialidades } = req.body;

  if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !rol) {
    return respuesta(res, 400, 'Faltan campos requeridos: nombre, apellido, dni, email, password, fecha_nacimiento, rol', null);
  }

  if (password.length < 8) {
    return respuesta(res, 400, 'La contraseña debe tener al menos 8 caracteres', null);
  }

  if (!ROLES_GESTIONABLES.includes(rol)) {
    return respuesta(res, 400, `El rol debe ser uno de: ${ROLES_GESTIONABLES.join(', ')}`, null);
  }

  if (rol === 'admin' && id_sede) {
    return respuesta(res, 400, 'Un administrador no debe tener sede asignada', null);
  }
  if (rol !== 'admin' && !id_sede) {
    return respuesta(res, 400, 'El rol indicado requiere una sede', null);
  }
  if (rol === 'medico' && (!Array.isArray(especialidades) || especialidades.length === 0)) {
    return respuesta(res, 400, 'Un médico requiere al menos una especialidad', null);
  }

  try {
    const [porDni] = await pool.query('SELECT id FROM usuario WHERE dni = ?', [dni]);
    if (porDni.length > 0) {
      return respuesta(res, 400, 'El DNI ya está registrado', null);
    }
    const [porEmail] = await pool.query('SELECT id FROM usuario WHERE email = ?', [email]);
    if (porEmail.length > 0) {
      return respuesta(res, 400, 'El email ya está registrado', null);
    }

    if (id_sede) {
      const [sede] = await pool.query('SELECT id FROM sede WHERE id = ?', [id_sede]);
      if (sede.length === 0) {
        return respuesta(res, 400, 'La sede indicada no existe', null);
      }
    }

    if (rol === 'medico') {
      const [filas] = await pool.query('SELECT id FROM especialidad WHERE id IN (?)', [especialidades]);
      if (filas.length !== especialidades.length) {
        return respuesta(res, 400, 'Alguna de las especialidades indicadas no existe', null);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [resultado] = await pool.query(
      `INSERT INTO usuario (nombre, apellido, dni, email, password, fecha_nacimiento, telefono, rol, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [nombre, apellido, dni, email, passwordHash, fecha_nacimiento, telefono || '', rol, id_sede || null]
    );

    if (rol === 'medico') {
      const valores = especialidades.map((idEsp) => [resultado.insertId, idEsp]);
      await pool.query('INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES ?', [valores]);
    }

    return respuesta(res, 201, 'ok', {
      id: resultado.insertId,
      nombre,
      apellido,
      dni,
      email,
      rol,
      id_sede: id_sede || null,
    });
  } catch (error) {
    console.error('Error al crear usuario:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

/**
 * PUT /usuarios/:id
 * Edición de cualquier tipo de usuario, incluidos los pacientes. Solo admin.
 * No permite cambiar dni ni rol; sí nombre, apellido, email, telefono,
 * fecha_nacimiento, sede (operador/medico), cobertura (paciente),
 * especialidades (medico) y, opcionalmente, resetear la contraseña.
 */
const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, fecha_nacimiento, id_sede, id_cobertura, especialidades, password } = req.body;

  if (password && password.length < 8) {
    return respuesta(res, 400, 'La contraseña debe tener al menos 8 caracteres', null);
  }

  try {
    const [usuarios] = await pool.query('SELECT id, rol FROM usuario WHERE id = ?', [id]);
    if (usuarios.length === 0) {
      return respuesta(res, 404, 'Usuario no encontrado', null);
    }
    const rol = usuarios[0].rol;

    if (email) {
      const [porEmail] = await pool.query('SELECT id FROM usuario WHERE email = ? AND id <> ?', [email, id]);
      if (porEmail.length > 0) {
        return respuesta(res, 400, 'El email ya está registrado', null);
      }
    }

    if (id_sede && rol === 'admin') {
      return respuesta(res, 400, 'Un administrador no debe tener sede asignada', null);
    }
    if (id_sede) {
      const [sede] = await pool.query('SELECT id FROM sede WHERE id = ?', [id_sede]);
      if (sede.length === 0) {
        return respuesta(res, 400, 'La sede indicada no existe', null);
      }
    }
    if (id_cobertura) {
      const [cobertura] = await pool.query('SELECT id FROM cobertura WHERE id = ?', [id_cobertura]);
      if (cobertura.length === 0) {
        return respuesta(res, 400, 'La cobertura indicada no existe', null);
      }
    }
    if (especialidades && rol !== 'medico') {
      return respuesta(res, 400, 'Solo un médico puede tener especialidades', null);
    }
    if (especialidades) {
      const [filas] = await pool.query('SELECT id FROM especialidad WHERE id IN (?)', [especialidades]);
      if (filas.length !== especialidades.length) {
        return respuesta(res, 400, 'Alguna de las especialidades indicadas no existe', null);
      }
    }

    const campos = [];
    const valores = [];
    if (nombre) { campos.push('nombre = ?'); valores.push(nombre); }
    if (apellido) { campos.push('apellido = ?'); valores.push(apellido); }
    if (email) { campos.push('email = ?'); valores.push(email); }
    if (telefono) { campos.push('telefono = ?'); valores.push(telefono); }
    if (fecha_nacimiento) { campos.push('fecha_nacimiento = ?'); valores.push(fecha_nacimiento); }
    if (id_sede && rol !== 'admin') { campos.push('id_sede = ?'); valores.push(id_sede); }
    if (id_cobertura && rol === 'paciente') { campos.push('id_cobertura = ?'); valores.push(id_cobertura); }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      campos.push('password = ?');
      valores.push(passwordHash);
    }

    if (campos.length > 0) {
      valores.push(id);
      await pool.query(`UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`, valores);
    }

    if (especialidades) {
      await pool.query('DELETE FROM medico_especialidad WHERE id_medico = ?', [id]);
      const filasNuevas = especialidades.map((idEsp) => [id, idEsp]);
      await pool.query('INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES ?', [filasNuevas]);
    }

    const [actualizado] = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono, u.fecha_nacimiento,
              u.rol, u.id_sede, s.nombre AS sede, u.id_cobertura, c.nombre AS cobertura
       FROM usuario u
       LEFT JOIN sede s ON s.id = u.id_sede
       LEFT JOIN cobertura c ON c.id = u.id_cobertura
       WHERE u.id = ?`,
      [id]
    );
    const conEspecialidades = await adjuntarEspecialidades(actualizado);

    return respuesta(res, 200, 'ok', conEspecialidades[0]);
  } catch (error) {
    console.error('Error al actualizar usuario:', error.message);
    respuesta(res, 500, 'Error interno del servidor', null);
  }
};

module.exports = { listarUsuarios, crearUsuario, actualizarUsuario };
