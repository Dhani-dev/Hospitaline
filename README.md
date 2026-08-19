# Hospitaline

API REST para la gestión de **hospitales, doctores y pacientes**, construida con **Node.js, Fastify, TypeScript y Supabase**. El proyecto incluye pruebas con **Vitest**, cobertura de código, **Docker**, **Docker Compose**, **GitHub Actions** y despliegue en **Render**.

- Test / staging: https://hospitaline-dev.onrender.com
- Producción: https://hospitaline.onrender.com
- Repositorio: https://github.com/Dhani-dev/Hospitaline

---

## Entornos y ramas

| Rama | Entorno | Coverage mínimo |
|---|---|---:|
| `dev` | Test / staging | ≥ 60% |
| `main` | Producción | ≥ 85% |

Flujo:

```text
dev → pipeline de test → Render Test
                    ↓
             merge a main
                    ↓
          pipeline de producción
                    ↓
             Render Production
```

---

## Tecnologías

- Node.js 22
- TypeScript
- Fastify
- Supabase / PostgreSQL
- Zod
- Vitest + V8 Coverage
- Docker + Docker Compose
- GitHub Actions
- Render

---

## Requisitos locales

- Node.js 22+
- npm
- Docker Desktop, si se desea ejecutar con contenedores
- Variables de entorno configuradas mediante `.env.test` y/o `.env.prod`

Puedes partir de los archivos de ejemplo:

```bash
cp .env.test.example .env.test
cp .env.prod.example .env.prod
```

En Windows PowerShell:

```powershell
Copy-Item .env.test.example .env.test
Copy-Item .env.prod.example .env.prod
```

Variables principales:

```text
PORT=3000
NODE_ENV=test
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=...
```

No subir archivos `.env` con credenciales reales al repositorio.

---

## Cómo ejecutar localmente

Instalar dependencias:

```bash
npm install
```

Desarrollo con recarga automática:

```bash
npm run dev
```

Compilar TypeScript:

```bash
npm run build
```

Ejecutar la versión compilada:

```bash
npm start
```

La API queda disponible en:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

---

## Tests y Coverage

Ejecutar todos los tests:

```bash
npm test
```

Ejecutar tests con coverage:

```bash
npm run test:coverage
```

Comprobar el mínimo de coverage para test:

```bash
npm run coverage:check:60
```

Comprobar el mínimo de coverage para producción:

```bash
npm run coverage:check:85
```

El reporte HTML se genera en:

```text
coverage/index.html
```

Para abrirlo:

```bash
# macOS
open coverage/index.html

# Windows
start coverage/index.html

# Linux
xdg-open coverage/index.html
```

Los mismos tests se utilizan para ambos ambientes; cambia únicamente el porcentaje mínimo exigido.

---

## Docker

El proyecto tiene:

| Archivo | Función |
|---|---|
| `Dockerfile` | Construye la imagen de la API |
| `docker-compose.yml` | Ejecuta la API y un contenedor para tests |

El `Dockerfile` utiliza varias etapas:

```text
node:22-alpine
      ↓
instalación de dependencias
      ↓
compilación TypeScript
      ↓
imagen final con dist/
```

La imagen final ejecuta:

```bash
node dist/server.js
```

Construir la imagen:

```bash
docker build -t hospitaline-api .
```

Ver imágenes:

```bash
docker images
```

Ejecutar la imagen directamente:

```bash
docker run --rm --env-file .env.test -p 3000:3000 hospitaline-api
```

---

## Docker Compose

`docker-compose.yml` define dos servicios:

```text
api
tests
```

### API

Construye la imagen mediante el `Dockerfile` y expone:

```text
localhost:3000
```

Levantar los servicios:

```bash
docker compose up --build
```

O en segundo plano:

```bash
docker compose up --build -d
```

Ver servicios:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs
```

Detener:

```bash
docker compose down
```

### Tests dentro de Docker

El servicio `tests` utiliza `node:22-alpine`, monta el proyecto y ejecuta:

```text
npm ci
npm run test:coverage
```

Ejecutarlo:

```bash
docker compose run --rm tests
```

Solo tests:

```bash
docker compose run --rm tests npm test
```

Tests con coverage:

```bash
docker compose run --rm tests npm run test:coverage
```

Comprobar coverage ≥ 60%:

```bash
docker compose run --rm tests npm run coverage:check:60
```

Comprobar coverage ≥ 85%:

```bash
docker compose run --rm tests npm run coverage:check:85
```

El parámetro `--rm` elimina el contenedor temporal al terminar.

---

## `npm install` vs `npm ci`

En el desarrollo local del proyecto se utiliza:

```bash
npm install
```

porque permite instalar las dependencias definidas en `package.json`.

El proyecto también tiene `package-lock.json`. Por eso `npm ci` es útil en entornos reproducibles como CI y Docker: instala exactamente las versiones registradas en el lockfile y no está pensado para modificarlo.

Actualmente el proyecto utiliza:

```text
Local:
npm install

Dockerfile:
npm install

Docker Compose - tests:
npm ci

GitHub Actions:
npm ci --force
```

Por lo tanto, cuando el README indica `npm install` para ejecutar el proyecto localmente, es intencional y coincide con la configuración actual.

---

## Endpoints

Las rutas están agrupadas bajo:

```text
/api/v1
```

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/hospitals` | Listar hospitales |
| `GET` | `/api/v1/hospitals/:id` | Obtener hospital |
| `POST` | `/api/v1/hospitals` | Crear hospital |
| `PUT` | `/api/v1/hospitals/:id` | Reemplazar hospital |
| `PATCH` | `/api/v1/hospitals/:id` | Actualizar parcialmente |
| `DELETE` | `/api/v1/hospitals/:id` | Eliminar hospital |
| `QUERY` | `/api/v1/hospitals/query` | Consultar hospitales |
| `GET` | `/api/v1/doctors` | Listar doctores |
| `GET` | `/api/v1/doctors/:id` | Obtener doctor |
| `POST` | `/api/v1/doctors` | Crear doctor |
| `PUT` | `/api/v1/doctors/:id` | Reemplazar doctor |
| `PATCH` | `/api/v1/doctors/:id` | Actualizar parcialmente |
| `DELETE` | `/api/v1/doctors/:id` | Eliminar doctor |
| `QUERY` | `/api/v1/doctors/query` | Consultar doctores |
| `GET` | `/api/v1/pacientes` | Listar pacientes |
| `GET` | `/api/v1/pacientes/:id` | Obtener paciente |
| `POST` | `/api/v1/pacientes` | Crear paciente |
| `PUT` | `/api/v1/pacientes/:id` | Reemplazar paciente |
| `PATCH` | `/api/v1/pacientes/:id` | Actualizar parcialmente |
| `DELETE` | `/api/v1/pacientes/:id` | Eliminar paciente |
| `QUERY` | `/api/v1/pacientes/query` | Consultar pacientes |

### Ejemplos

Health check:

```bash
curl http://localhost:3000/health
```

Listar hospitales:

```bash
curl http://localhost:3000/api/v1/hospitals
```

Crear hospital:

```bash
curl -X POST http://localhost:3000/api/v1/hospitals \
  -H "Content-Type: application/json" \
  -d '{"name":"Hospital Central","address":"Calle 10","city":"Medellín","phone":"6041234567"}'
```

Obtener por ID:

```bash
curl http://localhost:3000/api/v1/hospitals/UUID
```

Actualizar parcialmente:

```bash
curl -X PATCH http://localhost:3000/api/v1/hospitals/UUID \
  -H "Content-Type: application/json" \
  -d '{"city":"Cali"}'
```

Eliminar:

```bash
curl -X DELETE http://localhost:3000/api/v1/hospitals/UUID
```

---

## Flujo de la API

Una petición sigue esta estructura:

```text
Cliente HTTP
    ↓
Fastify
    ↓
Routes
    ↓
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Supabase
    ↓
PostgreSQL
```

- **Routes:** definen las rutas y métodos HTTP.
- **Controllers:** reciben la petición, validan datos y generan la respuesta.
- **Services:** contienen las reglas de negocio.
- **Repositories:** realizan las operaciones sobre Supabase.
- **Supabase:** proporciona el acceso a PostgreSQL.

Fastify es el framework encargado de recibir las solicitudes HTTP y dirigirlas al controlador correspondiente.

---

## Base de datos

La estructura de la base de datos se encuentra en:

```text
migrations/
├── 001_create_hospital.sql
├── 002_create_doctor.sql
└── 003_create_paciente.sql
```

Las entidades principales son:

```text
Hospital
 ├── Doctor
 └── Paciente
       └── Doctor
```

La aplicación utiliza Supabase para acceder a PostgreSQL.

---

## GitHub Actions (CI/CD)

Existen dos workflows:

```text
.github/workflows/
├── test-pipeline.yml
└── prod-pipeline.yml
```

### Test

Se ejecuta con cambios en `dev` y Pull Requests hacia `dev`.

```text
Checkout
 ↓
Node 22
 ↓
npm ci --force
 ↓
npm run build
 ↓
npm run test:coverage
 ↓
coverage ≥ 60%
 ↓
Deploy Hook de Render
```

### Producción

Se ejecuta con cambios en `main`.

```text
Checkout
 ↓
Node 22
 ↓
npm ci --force
 ↓
npm run build
 ↓
npm run test:coverage
 ↓
coverage ≥ 85%
 ↓
Deploy Hook de Render
```

Si fallan los tests o no se alcanza el coverage mínimo, el despliegue no continúa.

Los secretos de Supabase y Render se almacenan en **GitHub Secrets**.

---

## Render

Los servicios desplegados son:

- Test / staging: https://hospitaline-dev.onrender.com
- Producción: https://hospitaline.onrender.com

Health check:

```bash
curl https://hospitaline-dev.onrender.com/health
curl https://hospitaline.onrender.com/health
```

Ejemplo de endpoint:

```bash
curl https://hospitaline.onrender.com/api/v1/hospitals
```

La configuración detallada de Render se encuentra en [`RENDER_SETUP.md`](RENDER_SETUP.md).

---

## Estructura principal

```text
src/
├── app.ts
├── server.ts
├── bootstrap/
├── config/
├── controllers/
├── db/
├── errors/
├── plugins/
├── repositories/
├── routes/
├── services/
└── types/

tests/
├── integration/
└── unit/

migrations/
scripts/
.github/workflows/

Dockerfile
docker-compose.yml
package.json
vitest.config.ts
tsconfig.json
```
