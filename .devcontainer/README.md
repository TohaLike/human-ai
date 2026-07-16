# Dev Container — Human AI

One entry point: **Cursor / VS Code → “Reopen in Container”**.

This environment starts:

- Node 22 + project dependencies
- Redis (`redis:6379`)
- desktop-lite (VNC / noVNC) for Electron and Playwright windows

> **Note:** messenger support is **VK only for now**. The same Dev Container will cover future messenger adapters as they are added.

## How to open

1. Install Docker Desktop.
2. In Cursor: `Dev Containers: Reopen in Container`.
3. Wait for `postCreate` (`npm install`, Prisma, Playwright).
4. Open noVNC: [http://localhost:6080](http://localhost:6080)  
   Password: `vscode`
5. In the container terminal:

```bash
cd apps/desktop
npm run dev
```

Watch Electron / Chromium (VK) windows in noVNC.

## Environment variables

Inside the container these are already set:

```env
REDIS_HOST=redis
REDIS_PORT=6379
ELECTRON_DISABLE_SANDBOX=1
DISPLAY=:1
```

`apps/desktop/.env` may still contain `REDIS_HOST=127.0.0.1` for Mac host runs.
In the Dev Container, `remoteEnv` / `containerEnv` override that for the app process when the variable is already exported in the shell.

If Redis unexpectedly connects to `127.0.0.1`, run:

```bash
export REDIS_HOST=redis
cd apps/desktop && npm run dev
```

Or set this in `.env` when working only inside the container:

```env
REDIS_HOST=redis
```

## Without the full Dev Container (Redis only)

From the host:

```bash
docker compose -f .devcontainer/docker-compose.yml up -d redis
cd apps/desktop && npm run dev
```

Stop Redis:

```bash
docker compose -f .devcontainer/docker-compose.yml stop redis
```

Or from `apps/desktop`:

```bash
npm run infra:up
npm run infra:down
npm run dev:host   # Redis + Electron on the host
```

## Useful commands

```bash
# Redis ping
redis-cli -h redis ping

# Redis logs
docker compose -f .devcontainer/docker-compose.yml logs -f redis
```

## Why desktop-lite?

Electron + headed Playwright inside a plain Linux container have no display, so windows do not show up.
`desktop-lite` provides a virtual desktop in the browser — the simplest full Dev Container setup for this stack.
