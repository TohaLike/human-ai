# Dev Container — Human AI

Один вход: **Cursor / VS Code → “Reopen in Container”**.

Внутри поднимаются:
- Node 22 + зависимости проекта
- Redis (`redis:6379`)
- desktop-lite (VNC / noVNC) для окон Electron и Playwright

## Как открыть

1. Установи Docker Desktop.
2. В Cursor: `Dev Containers: Reopen in Container`.
3. Дождись `postCreate` (`npm install`, Prisma, Playwright).
4. Открой noVNC: [http://localhost:6080](http://localhost:6080)  
   пароль: `vscode`
5. В терминале контейнера:

```bash
cd apps/desktop
npm run dev
```

Окна Electron / Chromium (VK) смотри в noVNC.

## Переменные

В контейнере уже задано:

```env
REDIS_HOST=redis
REDIS_PORT=6379
ELECTRON_DISABLE_SANDBOX=1
DISPLAY=:1
```

`.env` в `apps/desktop` может содержать `REDIS_HOST=127.0.0.1` для запуска на Mac.
В Dev Container значение из `remoteEnv` / `containerEnv` перекрывает его для процесса Electron, если переменная уже экспортирована в shell.

Если Redis вдруг стучится на `127.0.0.1`, в терминале контейнера:

```bash
export REDIS_HOST=redis
cd apps/desktop && npm run dev
```

Или в `.env` для контейнера поставь:

```env
REDIS_HOST=redis
```

## Без Dev Container (только Redis)

С хоста:

```bash
docker compose -f .devcontainer/docker-compose.yml up -d redis
cd apps/desktop && npm run dev
```

Остановка Redis:

```bash
docker compose -f .devcontainer/docker-compose.yml stop redis
```

## Полезные команды

```bash
# Redis ping
redis-cli -h redis ping

# Логи redis
docker compose -f .devcontainer/docker-compose.yml logs -f redis
```

## Зачем так

Electron + headed Playwright внутри «голого» Linux-контейнера без дисплея не показывают окна.
`desktop-lite` даёт виртуальный рабочий стол через браузер — это самый простой full Dev Container для этого стека.
