# Hospitaline

API REST para la gestión de **hospitales, doctores y pacientes**, construida con **Node.js, Fastify, TypeScript y PostgreSQL**. El proyecto incluye **Docker**, **GKE**, **Cloud SQL** y, en Seguimiento #2, reuso HTTP de entidades de otras nubes más una **caché distribuida Redis**.

- Test / staging: https://hospitaline-dev.onrender.com
- Producción: https://hospitaline.onrender.com

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

Variables principales:

```text
PORT=3000
NODE_ENV=test
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=hospitaline
DB_USER=postgres
DB_PASSWORD=...
USERS_API_URL=https://biblio-express.azurewebsites.net
USERS_LAST_PATH=/api/v2/users/last
USERS_LIST_PATH=/api/users
ENTRENADOR_API_URL=https://pokenetes-api-prod.onrender.com
ENTRENADOR_LAST_PATH=/api/v2/entrenador/last
ENTRENADOR_LIST_PATH=/entrenador
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CACHE_TTL_SECONDS=60
PEER_CACHE_TTL_SECONDS=30
```

`USERS_API_URL` y `ENTRENADOR_API_URL` pueden quedar vacías hasta que existan las URLs de Azure y AWS. Si un peer no está configurado o falla, `local` sigue saliendo y el peer se marca con `live: false`. Nunca se inventan datos.

## API v2 y reuso entre nubes

Hospitaline no duplica la lógica de los compañeros: consume por HTTP el último `users` de [biblio-express](https://github.com/PholCast/biblio-express) (Azure) y el último `entrenador` de [Pokenetes-API](https://github.com/Enedev/Pokenetes-API) (AWS).

### GET /api/v2/{entidad}/last

Solo el último registro **local**. Sin `peers`. Las entidades son `hospitals`, `doctors` y `pacientes`.

```bash
curl http://localhost:3000/api/v2/hospitals/last
```

```json
{
  "api": "hospitaline",
  "version": "2.0.0",
  "trace_id": "...",
  "entity": "hospital",
  "local": { "id": "...", "name": "Central" }
}
```

### GET /api/v2/{entidad}/:id

Uno local (ese id) + last en vivo de biblio-express y Pokenetes. Así salen los 3 objetos.

```bash
curl http://localhost:3000/api/v2/hospitals/UUID
```

```json
{
  "api": "hospitaline",
  "version": "2.0.0",
  "trace_id": "...",
  "entity": "hospital",
  "local": { "id": "...", "name": "Central" },
  "peers": {
    "biblio-express": { "live": true, "entity": "users", "data": {} },
    "pokenetes": { "live": true, "entity": "entrenador", "data": {} }
  }
}
```

El cliente intenta primero `.../last` y, si aún no existe, usa el listado y toma el último ítem. El header `x-trace-id` se acepta, se responde y se propaga a las APIs compañeras.

Las APIs de los compañeros deben consumir `GET /api/v2/hospitals/last` (y opcionalmente `/api/v1/hospitals` como fallback).

## Caché distribuida

Este es el artefacto de la nube GCP (Integrante B): Redis con TTL e invalidación.

| Qué se cachea | Clave | TTL | Invalidación |
|---|---|---|---|
| Hospital / doctor / paciente por id | `hospitaline:local:{entidad}:{id}` | `CACHE_TTL_SECONDS` (60s) | POST, PUT, PATCH, DELETE |
| Último registro local | `hospitaline:local:{entidad}:last` | 60s | POST, PUT, PATCH, DELETE |
| `users` de biblio-express | `hospitaline:peer:biblio-express:users:last` | `PEER_CACHE_TTL_SECONDS` (30s) | solo TTL |
| `entrenador` de Pokenetes | `hospitaline:peer:pokenetes:entrenador:last` | 30s | solo TTL |

Los fallos de un peer (`live: false`) **no** se cachean, para reintentar en la siguiente petición. Si Redis no está configurado, la API usa una caché en memoria del proceso.

Health check con estado de caché:

```bash
curl http://localhost:3000/health
```

Local con Redis:

```bash
docker compose up --build
```

En GKE aplica primero `k8s/redis.yaml` y luego el deployment. `REDIS_HOST=redis` apunta al Service del clúster. El mismo cliente es compatible con Memorystore si más adelante se cambia el host.

```text
k8s/redis.yaml
k8s/deployment.yaml
```

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

Los tests y la generación de coverage están desactivados temporalmente. No forman parte
de los scripts de `npm`, Docker Compose ni los pipelines activos.

---

## Docker

El proyecto tiene:

| Archivo | Función |
|---|---|
| `Dockerfile` | Construye la imagen de la API |
| `docker-compose.yml` | Ejecuta la API |

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

## Endpoints

Las rutas están agrupadas bajo:

```text
/api/v1
```

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check + estado de la caché |
| `GET` | `/api/v1/hospitals` | Listar hospitales |
| `GET` | `/api/v1/hospitals/:id` | Obtener hospital |
| `GET` | `/api/v2/hospitals/last` | Último hospital local, sin peers |
| `GET` | `/api/v2/hospitals/:id` | Hospital local + last de `users` y `entrenador` |
| `GET` | `/api/v2/doctors/last` | Último doctor local, sin peers |
| `GET` | `/api/v2/doctors/:id` | Doctor local + last de `users` y `entrenador` |
| `GET` | `/api/v2/pacientes/last` | Último paciente local, sin peers |
| `GET` | `/api/v2/pacientes/:id` | Paciente local + last de `users` y `entrenador` |
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
├── cache/
├── config/
├── controllers/
├── db/
├── errors/
├── integrations/
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
