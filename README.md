# Human AI

Desktop assistant that listens to **VK Messenger** chats, learns your writing style, generates AI replies via **OpenRouter**, and can send them back into VK automatically or after approval.

The main app lives in `apps/desktop` — an **Electron + React + TypeScript** application with **Playwright** for browser automation, **SQLite (Prisma)** for storage, and **Redis + BullMQ** for background message processing.

---

## Table of contents

- [What this project does](#what-this-project-does)
- [How it works](#how-it-works)
- [Repository structure](#repository-structure)
- [Requirements](#requirements)
- [Quick start (Mac / host)](#quick-start-mac--host)
- [Dev Container setup](#dev-container-setup)
- [Configuration](#configuration)
- [Using the app](#using-the-app)
- [Pipeline details](#pipeline-details)
- [Useful commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

---

## What this project does

1. Opens a real VK chat in Chromium (Playwright, persistent profile).
2. Intercepts incoming VK long-poll updates (`ruim`).
3. Saves messages into a local SQLite database.
4. Queues each message for processing (BullMQ / Redis).
5. Updates a **style profile** from your own messages.
6. Builds conversation context and asks an LLM for a reply.
7. Stores the reply as `GeneratedReply` (`PENDING` → `APPROVED` → `SENT`).
8. Optionally auto-sends the reply into VK through the same Playwright page.

You control AI behavior (model, delays, system prompt, auto-send) from the Electron settings UI or from `.env`.

---

## How it works

```text
┌─────────────────────┐     ┌──────────────────────┐
│  Electron UI        │     │  Playwright Chromium │
│  (settings / replies│────▶│  VK chat page        │
│   launch chat)      │     └──────────┬───────────┘
└─────────────────────┘                │
                                       │ intercept long-poll (ruim)
                                       ▼
                              ┌────────────────┐
                              │ MessageBus     │
                              └───────┬────────┘
                                      ▼
                              ┌────────────────┐
                              │ MessageService │ ──▶ SQLite (Prisma)
                              └───────┬────────┘
                                      ▼
                              ┌────────────────┐
                              │ BullMQ queue   │ ──▶ Redis
                              └───────┬────────┘
                                      ▼
                              ┌────────────────────┐
                              │ MessageProcessor   │
                              │ • style analysis   │
                              │ • AI reply         │
                              │ • optional send    │
                              └─────────┬──────────┘
                                        ▼
                              ┌────────────────┐
                              │ VKSender       │ ──▶ types into VK
                              └────────────────┘
```

### Main modules

| Area | Path | Role |
|------|------|------|
| App bootstrap | `apps/desktop/src/main/index.ts` | Wires IPC, queue, AI, VK session |
| VK listen | `src/main/vk/VKLongPollListener.ts` | Parses long-poll updates |
| VK send | `src/main/vk/VKSender.ts` | Types + sends reply in chat UI |
| Messages | `src/main/messages/` | Persist + enqueue |
| Queue | `src/main/queue/` | BullMQ producer/worker + Redis |
| Style | `src/main/analysis/` | Style profile from your messages |
| Context | `src/main/context/` | Last N messages + style for the prompt |
| AI | `src/main/ai/` | PromptBuilder, OpenRouter, normalization |
| Replies | `src/main/replies/` | Pending / approve / send lifecycle |
| Config | `src/main/config/` | Runtime settings file + env sync |
| UI | `src/renderer/` | React settings workspace |
| Preload | `src/preload/` | Safe bridge: `window.config`, `window.replies`, … |
| DB | `apps/desktop/prisma/` | Schema + migrations + SQLite file |

---

## Repository structure

```text
human-ai/
├── .devcontainer/          # Dev Container + Redis compose + noVNC
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── devcontainer.json
│   ├── post-create.sh
│   ├── post-start.sh
│   └── README.md
├── apps/
│   └── desktop/            # Electron application (main product)
│       ├── prisma/         # Schema, migrations, SQLite DB
│       ├── src/
│       │   ├── main/       # Electron main process (Node)
│       │   ├── preload/    # contextBridge APIs
│       │   └── renderer/   # React UI
│       ├── .env            # Local secrets & AI settings (not committed ideally)
│       └── package.json
└── README.md               # This file
```

---

## Requirements

- **Node.js** 20+ (22 recommended)
- **npm**
- **Docker Desktop** (for Redis and/or Dev Container)
- **OpenRouter API key** — https://openrouter.ai
- VK account logged in via the Playwright browser profile (`apps/desktop/user-data`)

---

## Quick start (Mac / host)

This is the simplest day-to-day flow on your machine: Electron runs natively, Redis runs in Docker.

### 1. Install dependencies

```bash
cd apps/desktop
npm install
npx prisma generate
```

### 2. Configure environment

Create / edit `apps/desktop/.env`:

```env
DATABASE_URL="file:./prisma/human-ai.db"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini

AI_TRIGGER_ON_OWN_MESSAGES=false
AI_AUTO_SEND=true
AI_REPLY_DELAY_MS=400
AI_REPLY_DEBOUNCE_MS=800
AI_TEMPERATURE=0.75
AI_MAX_TOKENS=120

# Optional: custom system persona. If empty, built-in beta prompt is used.
# AI_SYSTEM_PROMPT="..."
```

### 3. Apply database migrations (first time)

```bash
cd apps/desktop
npx prisma migrate deploy
# or during development:
# npx prisma migrate dev
```

### 4. Start Redis + the app

```bash
cd apps/desktop
npm run dev:host
```

This runs:

1. `docker compose … up -d redis`
2. `electron-vite dev`

Equivalent manual steps:

```bash
npm run infra:up
npm run dev
```

### 5. In the Electron window

1. Paste a VK chat URL (`https://vk.com/im/convo/...`).
2. Fill OpenRouter key / model if needed.
3. Click **Save settings**.
4. Click **Open chat in browser**.
5. Log into VK once if the Playwright profile is empty.
6. Wait for incoming messages (or enable self-chat test mode).

---

## Dev Container setup

Full remote environment with Node, Redis, and a virtual desktop (noVNC) for Electron / Playwright windows.

Details: [`.devcontainer/README.md`](.devcontainer/README.md)

### Steps

1. Install **Docker Desktop**.
2. In Cursor / VS Code: **Dev Containers: Reopen in Container**.
3. Wait for `post-create` (`npm install`, Prisma generate, Playwright Chromium).
4. Open noVNC: http://localhost:6080  
   Password: `vscode`
5. In the container terminal:

```bash
cd apps/desktop
npm run dev
```

Inside the container Redis is available as:

```env
REDIS_HOST=redis
REDIS_PORT=6379
```

Watch Electron / VK windows inside the noVNC browser tab.

### Redis only (no full Dev Container)

```bash
docker compose -f .devcontainer/docker-compose.yml up -d redis
cd apps/desktop && npm run dev
```

Stop Redis:

```bash
cd apps/desktop && npm run infra:down
```

---

## Configuration

### Environment variables (`apps/desktop/.env`)

| Variable | Default | Meaning |
|----------|---------|---------|
| `DATABASE_URL` | `file:./prisma/human-ai.db` | SQLite path for Prisma |
| `REDIS_HOST` | `127.0.0.1` | Redis host (`redis` in Dev Container) |
| `REDIS_PORT` | `6379` | Redis port |
| `OPENROUTER_API_KEY` | — | Required for AI replies |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | OpenRouter model id |
| `AI_TRIGGER_ON_OWN_MESSAGES` | `false` | If `true`, reply to your own messages (self-chat tests) |
| `AI_AUTO_SEND` | `true` | Auto approve + send generated replies |
| `AI_REPLY_DELAY_MS` | `400` | Extra pause before sending |
| `AI_REPLY_DEBOUNCE_MS` | `800` | Wait for more incoming messages before generating |
| `AI_TEMPERATURE` | `0.75` | Sampling temperature |
| `AI_MAX_TOKENS` | `120` | Max completion tokens |
| `AI_SYSTEM_PROMPT` | empty | Custom system persona; if set, replaces default beta persona |
| `VK_CHAT_URL` | optional | Default chat URL seed |

Settings saved from the UI are stored in Electron `userData` as `app-settings.json` and applied to `process.env` at runtime.

### Runtime config (UI)

The Electron window can edit:

- VK chat URL
- OpenRouter API key & model
- Delay / debounce / temperature / max tokens
- Auto-send toggle
- Self-chat (`reply to my messages`) toggle

**Open chat in browser** opens Playwright on that URL and starts the VK listener.

---

## Using the app

### Normal chats (real people)

1. `AI_TRIGGER_ON_OWN_MESSAGES=false`
2. Open the other person’s chat.
3. When they write, AI generates a reply.
4. If `AI_AUTO_SEND=true`, it is sent after debounce + delay.
5. If auto-send is off, use **Pending replies** → **Approve + send**.

### Self-chat testing

1. Enable **Reply to my messages (self-chat test)**.
2. Open a chat with yourself.
3. Your messages are treated as triggers for AI.

### Important windows

There are **two** browser contexts:

1. **Electron window** — settings / controls (`window.config`, `window.replies`).
2. **Playwright Chromium** — actual VK UI (no Electron preload).

Use DevTools only in the Electron window for reply APIs.

---

## Pipeline details

### 1. Capture

`VKLongPollListener` watches Playwright network responses whose URL contains `ruim`, parses update type `10004`, and emits a message on `MessageBus`.

### 2. Persist + enqueue

`MessageService`:

- finds/creates `Conversation` by VK `peerId`
- upserts `Message` in SQLite
- adds BullMQ job `message-{id}`

### 3. Process

`MessageProcessor`:

- marks message `processed`
- if `isMine` → update style profile
- skip empty text / echo of already sent AI replies
- if incoming (or self-chat mode) → debounce → build context → call AI
- save `GeneratedReply`
- if auto-send → `approveAndSend` via `VKSender`

### 4. Prompting

- Default **beta** system prompt is built in `PromptBuilder` (natural messenger style).
- If `AI_SYSTEM_PROMPT` is set, that text replaces the default persona.
- Dynamic pieces always appended: capitalization/style stats from recent messages.
- Replies are normalized (e.g. trailing periods; optional dash stripping when custom prompt is active).

### 5. Data model (SQLite)

- `Conversation` — platform + external peer id
- `Message` — text, `isMine`, `processed`
- `StyleProfile` — JSON style features
- `GeneratedReply` — `PENDING` | `APPROVED` | `REJECTED` | `SENT`
- `StyleAnalysisSettings` — global vs per-chat style scope

---

## Useful commands

Run from `apps/desktop`:

```bash
npm run dev              # Electron only (Redis must already be up)
npm run dev:host         # Start Redis + Electron
npm run infra:up         # Start Redis container
npm run infra:down       # Stop Redis container
npm run infra:logs       # Tail Redis logs
npm run typecheck        # TypeScript checks
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Dev migrations
npm run build:mac        # Production mac build
```

Inspect DB:

```bash
sqlite3 prisma/human-ai.db "SELECT id, text, isMine, processed FROM Message ORDER BY id DESC LIMIT 10;"
sqlite3 prisma/human-ai.db "SELECT id, text, status FROM GeneratedReply ORDER BY createdAt DESC LIMIT 10;"
```

Redis ping (host):

```bash
docker exec -it "$(docker ps -qf name=redis)" redis-cli ping
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Jobs fail / nothing processes | Redis down | `npm run infra:up` or reopen Dev Container |
| AI never replies | Missing API key | Set `OPENROUTER_API_KEY` or UI field + Save |
| Replies stay `PENDING` | `AI_AUTO_SEND=false` | Enable auto-send or Approve + send |
| Self-chat ignored | Flag off | Enable “reply to my messages” |
| `window.replies` undefined | DevTools in Playwright window | Use Electron window DevTools |
| VK send fails | Wrong chat open / UI changed | Re-open chat URL; check composer selectors |
| Slow replies | Debounce + delay + OpenRouter latency | Lower `AI_REPLY_DEBOUNCE_MS` / `AI_REPLY_DELAY_MS` |
| Container Redis connection refused | App still uses `127.0.0.1` | `export REDIS_HOST=redis` before `npm run dev` |

---

## Tech stack

- **Electron** + **electron-vite** + **React 19** + **TypeScript**
- **Playwright** (persistent Chromium for VK)
- **Prisma** + **SQLite** (`better-sqlite3`)
- **BullMQ** + **Redis**
- **OpenRouter** (chat completions API)

---

## License / notes

Local desktop project. Keep `.env` and API keys out of git. The Playwright profile under `apps/desktop/user-data` contains your VK session — treat it as sensitive.
