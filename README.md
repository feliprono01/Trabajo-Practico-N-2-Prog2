# Trabajo Práctico N°2 - Programación 2

Proyecto desarrollado como parte de la materia **Programación 2**: Sistema de Gestión de Turnos Médicos.

## Desarrolladores

- **Prono Felipe**
- **Serovich Emilio**
- **Barra Francisco**

## Stack

- Backend: Node.js + Express, autenticación con JWT, contraseñas hasheadas con bcrypt.
- Base de datos: MySQL/MariaDB (script `backend/clinica.sql`).

## Backend — puesta en marcha

1. Instalar dependencias:
   ```
   cd backend
   npm install
   ```
2. Crear la base de datos e importar el script provisto:
   ```
   mysql -u root -p -e "CREATE DATABASE clinica"
   mysql -u root -p clinica < clinica.sql
   ```
3. Copiar `.env.example` a `.env` y completar las credenciales de la base y el secreto de JWT:
   ```
   cp .env.example .env
   ```
4. Levantar el servidor:
   ```
   npm run dev
   ```
5. Verificar que todo esté funcionando: `GET http://localhost:3000/health` debe responder `200` con `estado: "ok"`.

## Formato de respuesta

Todos los endpoints (éxito y error) responden con la misma estructura:

```json
{ "codigo": 200, "estado": "ok", "datos": { } }
```

## Roles

Los roles vigentes en la base (`clinica.sql`) son `paciente`, `medico`, `operador` y `admin`.

- `paciente`: se crea únicamente vía `POST /auth/registro`. No tiene acceso a sedes, especialidades, coberturas (excepto lectura) ni agenda.
- `medico`: gestiona su propia agenda (`/agenda`), atiende turnos (`PUT /turnos/:id/atender`) y carga historial clínico (`POST /historial-clinico`).
- `operador`: gestiona la agenda de cualquier médico y sede, puede crear y cancelar turnos de su sede, y consulta los turnos de su sede por fecha (`GET /turnos/sede`).
- `paciente`: puede solicitar turnos (`POST /turnos`), cancelar los propios, ver sus turnos (`GET /turnos/mis-turnos`), su historial clínico y sus notificaciones.
- `admin`: único rol habilitado para el CRUD de sedes, especialidades y coberturas.

### Usuarios de prueba

El script `clinica.sql` originalmente traía los usuarios con hashes de ejemplo (`$2b$10$hashdeejemplo1`) que no eran hashes bcrypt válidos, por lo que era imposible loguearse con ellos. Con autorización de la cátedra se reemplazaron por hashes bcrypt reales, de modo que los cuatro usuarios quedan listos para usar sin pasos adicionales.

**Contraseña de todos: `Test1234!`**

| Rol | Nombre | DNI (usuario de login) |
|---|---|---|
| `admin` | Marcos Gomez | `18222333` |
| `medico` | Ana Lopez | `20111222` |
| `operador` | Juan Perez | `15200548` |
| `paciente` | Franco Friggeri | `36000960` |

Para generar hashes propios, si hiciera falta: `node -e "console.log(require('bcrypt').hashSync('miclave', 10))"`.

## Colección de Postman

Hay una única colección en `backend/Postman_TP2_Backend.postman_collection.json`, con una carpeta por cada semana de entrega (Semana 1, Semana 2 y Semana 3), en el mismo orden en que se liberaron las consignas. Dentro de cada carpeta los requests incluyen tanto los casos exitosos como los casos negativos pedidos por los criterios de aceptación (400, 401, 403, 404, 409).

Para correrla de punta a punta sin tocar nada a mano:

1. Importar `clinica.sql` sobre una base limpia y levantar el servidor (`npm run dev`).
2. Importar la colección en Postman y, sobre la colección completa, usar **Run collection** con las carpetas "Semana 1", "Semana 2" y "Semana 3" en ese orden. Los tokens se completan solos vía test scripts — no hace falta pegar nada a mano.

Variables de la colección:

- `base_url`: URL del servidor (por defecto `http://localhost:3000`).
- `token`: JWT de un usuario `paciente`. Se completa automáticamente al correr `Semana 1 > Auth > POST /auth/login POSITIVO`, y se reutiliza en las semanas siguientes para los casos negativos de rol (403).
- `admin_token`: JWT del usuario `admin` (Marcos Gomez). Se completa automáticamente al correr `Semana 2 > Setup > POST /auth/login ADMIN`.
- `medico_token`: JWT del usuario `medico` (Ana Lopez). Se completa automáticamente al correr `Semana 3 > Setup > POST /auth/login MEDICO`.

Las colecciones de Semana 2 y Semana 3 están pensadas para correrse sobre una base recién importada desde `clinica.sql` (los IDs de los requests asumen los autoincrementales del script original).

