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
- `medico`: gestiona únicamente su propia agenda (`/agenda`).
- `operador`: gestiona la agenda de cualquier médico y sede.
- `admin`: único rol habilitado para el CRUD de sedes, especialidades y coberturas.

Los usuarios semilla del script (`admin`, `medico`, `operador`) tienen contraseñas de ejemplo con hashes no válidos, así que no se puede loguear con ellos tal cual vienen. Para probar endpoints que requieren esos roles hay dos opciones:

- Actualizar el `password` de un usuario semilla con un hash bcrypt real (por ejemplo generado con `node -e "console.log(require('bcrypt').hashSync('miclave', 10))"`) y loguear por `POST /auth/login` con su DNI.
- Registrar un usuario por `POST /auth/registro` (queda como `paciente`) y luego actualizarle el `rol` directamente en la base.

## Colección de Postman

Hay una única colección en `backend/Postman_TP2_Backend.postman_collection.json`, con una carpeta por cada semana de entrega (Semana 1 y Semana 2), en el mismo orden en que se liberaron las consignas. Dentro de cada carpeta los requests incluyen tanto los casos exitosos como los casos negativos pedidos por los criterios de aceptación (400, 401, 403, 404, 409).

Variables de la colección:

- `base_url`: URL del servidor (por defecto `http://localhost:3000`).
- `token`: JWT de un usuario `paciente`. Se completa solo al correr `Semana 1 > Auth > POST /auth/login POSITIVO`, y se reutiliza en Semana 2 para los casos negativos de rol (403).
- `admin_token`: JWT de un usuario `admin`, `medico` u `operador`, necesario para los endpoints de Semana 2. Hay que pegarlo a mano siguiendo lo indicado en la sección Roles.

La colección de Semana 2 está pensada para correrse sobre una base recién importada desde `clinica.sql` (los IDs de los requests de actualización/baja asumen los autoincrementales del script original).
