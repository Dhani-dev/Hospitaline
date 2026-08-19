# Render - Hospitaline

Configuración de los dos ambientes de despliegue de Hospitaline en Render.

- Test / staging: https://hospitaline-dev.onrender.com
- Producción: https://hospitaline.onrender.com

---

## Servicios

| Servicio | Rama | Entorno |
|---|---|---|
| `hospitaline-dev` | `dev` | Test / staging |
| `hospitaline` | `main` | Producción |

El flujo es:

```text
dev → GitHub Actions → Render Test
                ↓
          merge a main
                ↓
main → GitHub Actions → Render Production
```

---

## Configuración de Render

Crear un **Web Service** conectado al repositorio:

```text
https://github.com/Dhani-dev/Hospitaline
```

### Servicio de test

```text
Branch: dev
```

### Servicio de producción

```text
Branch: main
```

Para ambos servicios:

```text
Runtime: Node
Build Command para el entorno de test: npm install && npm run build
Build Command para el entorno de producción: npm ci --include=dev && npm run build
Start Command: npm run start
Health Check Path: /health
```

El `Build Command` utiliza `npm install` porque es la configuración actual del proyecto y coincide con el `Dockerfile`.

---

## Variables de entorno

### Test

Configurar en Render:

```text
NODE_ENV=test
PORT=3000
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=...
```

### Producción

Configurar:

```text
NODE_ENV=production
PORT=3000
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=...
```

Las credenciales de test y producción deben ser independientes.

No guardar las credenciales reales en GitHub.

---

## Health Check

Render utiliza:

```text
/health
```

La API responde:

```json
{
  "status": "ok"
}
```

Comprobar manualmente:

```bash
curl https://hospitaline-dev.onrender.com/health
curl https://hospitaline.onrender.com/health
```

---

## Deploy Hooks

Para conectar GitHub Actions con Render:

1. Abrir el servicio en Render.
2. Ir a **Settings**.
3. Crear un **Deploy Hook**.
4. Copiar la URL.
5. Guardarla en GitHub Secrets.

Para test:

```text
RENDER_TEST_DEPLOY_HOOK
```

Para producción:

```text
RENDER_PROD_DEPLOY_HOOK
```

Las URLs de los Deploy Hooks deben mantenerse privadas.

---

## GitHub Secrets

### Test

```text
SUPABASE_TEST_URL
SUPABASE_TEST_SECRET_KEY
SUPABASE_TEST_PUBLISHABLE_KEY
SUPABASE_TEST_JWKS_URL
RENDER_TEST_DEPLOY_HOOK
```

### Producción

```text
SUPABASE_PROD_URL
SUPABASE_PROD_SECRET_KEY
SUPABASE_PROD_PUBLISHABLE_KEY
SUPABASE_PROD_JWKS_URL
RENDER_PROD_DEPLOY_HOOK
```

---

## Pipeline de test

Archivo:

```text
.github/workflows/test-pipeline.yml
```

Se ejecuta con:

```text
push a dev
Pull Request hacia dev
```

Proceso:

```text
npm ci --force
    ↓
npm run build
    ↓
npm run test:coverage
    ↓
npm run coverage:check:60
    ↓
Deploy Hook Render
```

El despliegue solamente ocurre si el coverage alcanza **60%**.

---

## Pipeline de producción

Archivo:

```text
.github/workflows/prod-pipeline.yml
```

Se ejecuta con:

```text
push a main
```

Proceso:

```text
npm ci --force
    ↓
npm run build
    ↓
npm run test:coverage
    ↓
npm run coverage:check:85
    ↓
Deploy Hook Render
```

El despliegue solamente ocurre si el coverage alcanza **85%**.

---

## Docker y Render

Docker se utiliza principalmente para la integración y ejecución local del proyecto.

### Imagen de la API

```bash
docker build -t hospitaline-api .
```

Ejecutar:

```bash
docker run --rm --env-file .env.test -p 3000:3000 hospitaline-api
```

### Docker Compose

```bash
docker compose up --build
```

Ejecutar tests en contenedor:

```bash
docker compose run --rm tests
```

Detener:

```bash
docker compose down
```

El pipeline actual de GitHub Actions valida el proyecto con Node.js directamente y después activa el despliegue de Render mediante un Deploy Hook. El `Dockerfile` y `docker-compose.yml` permiten demostrar y reproducir el entorno con contenedores de forma local.

---

## URLs desplegadas

### Test

```text
https://hospitaline-dev.onrender.com
```

Ejemplo:

```bash
curl https://hospitaline-dev.onrender.com/api/v1/hospitals
```

### Producción

```text
https://hospitaline.onrender.com
```

Ejemplo:

```bash
curl https://hospitaline.onrender.com/api/v1/hospitals
```

---

## Verificación del despliegue

Después de un despliegue:

1. Revisar los logs del servicio en Render.
2. Probar `/health`.
3. Probar un `GET` de los recursos.
4. Comprobar que la API puede comunicarse con Supabase.

Ejemplo:

```bash
curl https://hospitaline.onrender.com/health
curl https://hospitaline.onrender.com/api/v1/hospitals
```

Si el pipeline falla en tests o coverage, Render no recibe la solicitud de despliegue.
