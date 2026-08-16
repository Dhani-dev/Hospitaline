# Render Deployment Setup Guide

## 1. Service Provisioning

1. Open Render Dashboard and click **New +** > **Web Service**.
2. Connect your GitHub account and select this repository.
3. Create the **test service**:
   - Name: `hospitaline-test`
   - Branch: `dev`
   - Region: closest to your users
   - Runtime: `Node`
4. Create the **production service**:
   - Name: `hospitaline-prod`
   - Branch: `main`
   - Region: production region
   - Runtime: `Node`

## 2. Environment and Build Configuration

Use these settings in both services unless noted otherwise.

- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/health`

### Test Service Environment Variables (`hospitaline-test`)

- `NODE_ENV=test`
- `PORT=3000`
- `SUPABASE_URL=<test-supabase-url>`
- `SUPABASE_SECRET_KEY=<test-supabase-secret-key>`
- `SUPABASE_PUBLISHABLE_KEY=<test-supabase-publishable-key>`
- `SUPABASE_JWKS_URL=<test-supabase-jwks-url>`

### Production Service Environment Variables (`hospitaline-prod`)

- `NODE_ENV=production`
- `PORT=3000`
- `SUPABASE_URL=<prod-supabase-url>`
- `SUPABASE_SECRET_KEY=<prod-supabase-secret-key>`
- `SUPABASE_PUBLISHABLE_KEY=<prod-supabase-publishable-key>`
- `SUPABASE_JWKS_URL=<prod-supabase-jwks-url>`

## 3. Automated Deploy Hooks

1. In Render, open `hospitaline-test` service.
2. Go to **Settings** > **Deploy Hook** and create a hook.
3. Copy the URL and store in GitHub repository secret named `RENDER_TEST_DEPLOY_HOOK`.
4. Repeat for `hospitaline-prod` and store in `RENDER_PROD_DEPLOY_HOOK`.

## 4. GitHub Secrets Required for CI/CD

### Test pipeline (`dev` branch)

- `SUPABASE_TEST_URL`
- `SUPABASE_TEST_SECRET_KEY`
- `SUPABASE_TEST_PUBLISHABLE_KEY`
- `SUPABASE_TEST_JWKS_URL`
- `RENDER_TEST_DEPLOY_HOOK`

### Production pipeline (`main` branch)

- `SUPABASE_PROD_URL`
- `SUPABASE_PROD_SECRET_KEY`
- `SUPABASE_PROD_PUBLISHABLE_KEY`
- `SUPABASE_PROD_JWKS_URL`
- `RENDER_PROD_DEPLOY_HOOK`

## 5. Deployment Behavior

- Push/PR to `dev` triggers test pipeline:
  - Build, test, coverage validation (>= 60%), deploy to `hospitaline-test`.
- Push to `main` triggers production pipeline:
  - Build, test, coverage validation (>= 85%), deploy to `hospitaline-prod`.
- If tests fail or coverage is below threshold, deployment is blocked.
