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
   > Si ya tenías una base `clinica` de la entrega de semana 1, hay que **reimportarla desde cero**: en la entrega de semanas 2 a 4 se migraron las columnas de ID de `tinyint` a `int` (tinyint solo soporta ~127 filas y los datos de prueba ampliados lo superan) y se agregaron médicos/turnos/agenda nuevos. Borrá la base vieja (`DROP DATABASE clinica;`) antes de volver a importar.
3. Copiar `.env.example` a `.env` y completar las credenciales de la base, el secreto de JWT y la URL del frontend (para CORS):
   ```
   cp .env.example .env
   ```
   Variables: `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL` (origen permitido por CORS, por defecto `http://localhost:4200`).
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

- `paciente`: se crea únicamente vía `POST /auth/registro`. Puede pedir turnos (`POST /turnos`), ver y cancelar los propios, consultar su historial clínico, sus notificaciones, y editar sus propios datos (`PUT /auth/perfil`: email, contraseña, teléfono, cobertura).
- `medico`: gestiona su propia agenda (`/agenda`), puede atender en más de una sede (la sede depende de cada franja de agenda, no de un valor fijo), atiende turnos (`PUT /turnos/:id/atender`) y carga historial clínico (`POST /historial-clinico`) solo de los turnos que él mismo atendió.
- `operador`: gestiona la agenda y los turnos únicamente de su propia sede (alta/modificación/baja de agenda devuelve 403 si la sede no coincide con la suya; la consulta de otras sedes sigue permitida), da de alta pacientes y les asigna turnos, y busca pacientes por DNI/apellido (`GET /pacientes/buscar`).
- `admin`: único rol habilitado para el CRUD de sedes, especialidades y coberturas, y el único con gestión de usuarios (`/usuarios`: alta/edición de operador, médico y admin, con auditoría), acceso a los logs de auditoría (`GET /auditoria`, paginado) y a los reportes y estadísticas (`GET /reportes/*`).
- Lectura de `GET /sedes`, `GET /especialidades`, `GET /coberturas` y `GET /medicos` disponible para **cualquier usuario logueado** (coberturas además es pública, sin necesidad de token).

### Usuarios de prueba

El script `clinica.sql` originalmente traía los usuarios con hashes de ejemplo (`$2b$10$hashdeejemplo1`) que no eran hashes bcrypt válidos, por lo que era imposible loguearse con ellos. Con autorización de la cátedra se reemplazaron por hashes bcrypt reales, de modo que los usuarios quedan listos para usar sin pasos adicionales.

**Contraseña de todos: `Test1234!`**

| Rol | Nombre | DNI (usuario de login) | Sede | Especialidad |
|---|---|---|---|---|
| `admin` | Marcos Gomez | `18222333` | — | — |
| `medico` | Ana Lopez | `20111222` | Sede Centro | Traumatologia |
| `medico` | Pedro Garcia | `21333444` | Sede Centro | Clinica Medica |
| `medico` | Sofia Martinez | `22444555` | Sede Centro (también atiende en Sede Norte) | Pediatria |
| `operador` | Juan Perez | `15200548` | Sede Centro | — |
| `operador` | Diego Rodriguez | `28666777` | Sede Norte | — |
| `paciente` | Franco Friggeri | `36000960` | — | — |
| `paciente` | Laura Diaz | `30555666` | — | — |
| `paciente` | Carla Fernandez | `40777888` | — | — |

La base de prueba incluye agenda y turnos en los tres estados (`confirmado`, `cancelado`, `atendido`) para el día actual y días cercanos, ver el bloque de `agenda`/`turno` en `clinica.sql`.

Para generar hashes propios, si hiciera falta: `node -e "console.log(require('bcrypt').hashSync('miclave', 10))"`.

## Endpoints agregados en la entrega de semanas 2 a 4

Además de los endpoints de semana 1 (`/auth`, `/coberturas`) y semanas 2-4 originales (`/sedes`, `/especialidades`, `/agenda`, `/turnos`, `/historial-clinico`, `/notificaciones`, `/auditoria`, `/reportes`), se agregaron:

- `PUT /auth/perfil`: el usuario autenticado actualiza email, contraseña, teléfono y/o cobertura propios.
- `GET /usuarios` (admin, paginado, filtros `nombre`/`apellido`/`rol`/`id_sede`), `POST /usuarios` (admin, alta de operador/médico/admin), `PUT /usuarios/:id` (admin, edición de cualquier usuario incluidos pacientes).
- `GET /medicos` (cualquier rol logueado): médicos con sus especialidades, filtrable por `id_especialidad` e `id_sede`.
- `GET /pacientes/buscar?dni=` o `?apellido=` (operador, médico, admin).
- `GET /agenda/fechas-disponibles` y `GET /agenda/horarios-disponibles` (paciente, operador, médico, admin): disponibilidad real para el wizard de turno, turnos de 30 minutos.
- `GET /notificaciones/no-leidas`: cantidad de notificaciones no leídas, para el contador del header.
- `PUT /notificaciones/leidas`: marca todas las notificaciones del usuario autenticado como leídas de una sola vez.

Reglas de negocio ajustadas: `GET /sedes` y `GET /especialidades` ya no requieren rol admin (solo lectura); el operador ahora está restringido a su propia sede también para la **agenda** (antes solo para turnos); un médico puede cancelar sus propios turnos en cualquier sede donde atienda (antes se comparaba contra la sede fija del usuario); no se puede modificar un rango de agenda dejando turnos confirmados fuera de él, ni eliminarlo si tiene turnos confirmados; no se puede eliminar una especialidad en uso en la agenda; `GET /auditoria` ahora pagina (`page`/`pageSize`) y trae el nombre de quien hizo cada acción.

Validaciones agregadas tras la revisión manual de la entrega:

- Alta y edición de usuarios (`POST`/`PUT /usuarios`) y registro de paciente (`POST /auth/registro`) rechazan nombre/apellido/dirección/teléfono/descripción compuestos solo por espacios en blanco (se recortan con `trim()` antes de validar y guardar).
- Las contraseñas (alta/edición de usuarios, registro, `PUT /auth/perfil`) ya no aceptan strings de solo espacios: se exige una longitud mínima de 8 caracteres **después** de recortar los espacios.
- El alta y la edición de operador/médico/administrador exige mayoría de edad (18 años); no aplica a pacientes, que pueden registrarse o editarse sin esa restricción.
- `POST`/`PUT /agenda`: además de rechazar rangos horarios superpuestos para un mismo médico, exige un margen mínimo de 30 minutos entre el fin de un rango y el comienzo de otro cuando pertenecen a sedes distintas (tiempo de traslado), devolviendo 409 con un mensaje que indica cuál es el rango en conflicto.
- `POST /auth/login` ahora incluye el nombre de la sede (`sede`) en la respuesta, además del `id_sede`, para que el frontend lo muestre sin pegarle a otro endpoint.

## Colección de Postman

Hay una única colección en `backend/Postman_TP2_Backend.postman_collection.json`, con una carpeta por cada semana de entrega (Semana 1, Semana 2, Semana 3 y Semana 4) y una carpeta adicional **"Semana 2 a 4 (ampliación)"** con los endpoints nuevos de esta entrega (usuarios, médicos, búsqueda de pacientes, disponibilidad de agenda, auditoría paginada, contador y marcado de notificaciones, autoedición de perfil). Dentro de cada carpeta los requests incluyen tanto los casos exitosos como los casos negativos pedidos por los criterios de aceptación (400, 401, 403, 404, 409), incluidos los agregados tras la revisión manual: edad mínima, contraseña/nombre de solo espacios y margen de 30 minutos entre sedes distintas en la agenda. La carpeta de ampliación reutiliza los tokens que ya dejan seteados las carpetas de Setup anteriores, así que hay que correr al menos un login de cada rol antes.

Para correrla de punta a punta sin tocar nada a mano:

1. Importar `clinica.sql` sobre una base limpia y levantar el servidor (`npm run dev`).
2. Importar la colección en Postman y, sobre la colección completa, usar **Run collection** con las carpetas "Semana 1", "Semana 2", "Semana 3" y "Semana 4" en ese orden. Los tokens se completan solos vía test scripts — no hace falta pegar nada a mano.

Variables de la colección:

- `base_url`: URL del servidor (por defecto `http://localhost:3000`).
- `token`: JWT de un usuario `paciente`. Se completa automáticamente al correr `Semana 1 > Auth > POST /auth/login POSITIVO`, y se reutiliza en las semanas siguientes para los casos negativos de rol (403).
- `admin_token`: JWT del usuario `admin` (Marcos Gomez). Se completa automáticamente al correr `Semana 2 > Setup > POST /auth/login ADMIN`.
- `token_medico`: JWT del usuario `medico` (Ana Lopez). Se completa automáticamente al correr `Semana 3 > Setup > POST /auth/login MEDICO`.
- `token_paciente`: JWT del usuario `paciente` (Franco Friggeri). Se completa automáticamente al correr `Semana 3 > Setup - Logins > Login Paciente`, y se reutiliza en Semana 4 para los casos negativos de rol (403) de auditoría y reportes.

Las colecciones de Semana 2, Semana 3 y Semana 4 están pensadas para correrse sobre una base recién importada desde `clinica.sql` (los IDs de los requests asumen los autoincrementales del script original).
