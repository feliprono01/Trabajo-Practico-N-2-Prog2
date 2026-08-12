# Guía de Arranque — Backend TP2 Prog2

## Requisitos previos
- Node.js instalado
- XAMPP instalado
- El repositorio ya clonado localmente

---

## Paso 1 — Importar la base de datos (solo la primera vez)

1. Abrir **XAMPP** e iniciar los módulos **Apache** y **MySQL**.
2. Entrar a [http://localhost/phpmyadmin](http://localhost/phpmyadmin) desde el navegador.
3. En el menú lateral, hacer clic en **Importar**.
4. Seleccionar el archivo `clinica.sql` que está dentro de la carpeta `backend/`.
5. Hacer clic en **Continuar**.

> Esto crea la base de datos `clinica` con todas sus tablas y datos de ejemplo. Solo se necesita hacerlo una vez. Si ya fue importado antes, saltar este paso.

---

## Paso 2 — Configurar las variables de entorno (solo la primera vez)

Dentro de la carpeta `backend/` hay un archivo llamado `.env.example`. Seguir una de las opciones.

**Opción A — Copiarlo (recomendado):**
```powershell
copy .env.example .env
```

**Opción B — Renombrarlo directamente:**  
Renombrar el archivo `.env.example` a `.env` desde el explorador de archivos o con:
```powershell
Rename-Item .env.example .env
```

Luego abrir el `.env` y verificar que los datos coincidan con la configuración de XAMPP:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=        ← dejar vacío si XAMPP no tiene contraseña configurada
DB_NAME=clinica
JWT_SECRET=clave_super_secreta_cambiar_en_produccion
JWT_EXPIRES_IN=8h
```

---

## Paso 3 — Instalar dependencias (solo la primera vez)

Abrir una terminal, **navegar a la carpeta `backend`** y ejecutar:

```powershell
cd ruta\al\proyecto\Trabajo-Practico-N-2-Prog2\backend
npm install
```

---

## Paso 4 — Levantar el servidor

Con MySQL ya corriendo en XAMPP y el `.env` configurado, ejecutar:

```powershell
npm run dev
```

Si todo está bien, se debería ver:
```
[nodemon] starting `node index.js`
Servidor corriendo en http://localhost:3000
```

Para verificar que el servidor y la base de datos responden correctamente, abrir el navegador en:
```
http://localhost:3000/health
```
Respuesta esperada:
```json
{ "codigo": 200, "estado": "ok", "datos": { "mensaje": "Servidor y base de datos funcionando correctamente" } }
```

---

## Arranque diario (a partir de la segunda vez)

Solo se necesita hacer esto cada vez que se quiera trabajar:

1. Iniciar **MySQL** en XAMPP.
2. Abrir la terminal en la carpeta `backend/`.
3. Ejecutar `npm run dev`.

---

## Colección de Postman

El archivo `Postman_Semana1.postman_collection.json` (ubicado en la carpeta `backend/`) contiene todos los endpoints listos para importar y probar.

**Para importar en Postman:**
1. Abrir Postman.
2. Hacer clic en **Import**.
3. Seleccionar el archivo `Postman_Semana1.postman_collection.json`.
4. La colección incluye la variable `{{base_url}}` preconfigurada en `http://localhost:3000`.

**Orden recomendado para probar:**
1. `GET /health` — verificar que el servidor y la BD responden.
2. `GET /coberturas` — listar coberturas disponibles.
3. `POST /auth/registro` — registrar un usuario nuevo.
4. `POST /auth/registro CAMPOS FALTANTES` — probar validación (espera 400).
5. `POST /auth/registro DNI DUPLICADO` — probar duplicado (espera 400).
6. `POST /auth/login POSITIVO` — hacer login y guardar el token automáticamente.
7. `GET /auth/perfil` — ver perfil del usuario autenticado.
8. `GET /auth/admin-test` — probar restricción de rol (espera 403 con token de paciente).
9. `POST /auth/login NEGATIVO` — probar credenciales incorrectas (espera 401).
10. `GET /auth/perfil (sin token)` — probar acceso sin autenticar (espera 401).
11. `GET /ruta-inexistente` — probar ruta no definida (espera 404).

---

## Nota sobre CORS

Por el momento, el backend **no tiene CORS habilitado**. Esto no es necesario en esta etapa porque se está trabajando únicamente con el backend y probando los endpoints desde Postman o el navegador directamente.

Cuando se inicie la etapa de frontend con **Angular**, se habilitará CORS para permitir que el frontend se comunique con el backend sin problemas.
