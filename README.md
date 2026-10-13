# Task Reminder API (Capstone)

A feature-rich backend API built with **Node.js + Express + TypeScript**, using **MongoDB**, **Redis/BullMQ**, **WebSockets (Socket.IO)**, background workers, and email reminders.  
Containerized with Docker and automated with GitHub Actions CI.

## Live Deployment

- **API URL:** `https://YOUR-DEPLOYED-URL`
- **Health check:** `https://YOUR-DEPLOYED-URL/health`
---

## Features

- Task CRUD APIs
- Reminder background jobs using BullMQ
- Redis-backed queue processing
- Email reminders:
  - `MAIL_MODE=stream` (log-only, no real send)
  - `MAIL_MODE=smtp` (SMTP provider)
  - `MAIL_MODE=resend` (real send via Resend API)
- CPU demo endpoints:
  - `/cpu/blocking` (event-loop blocking)
  - `/cpu/worker` (worker thread offload)
- Socket.IO integration (real-time foundation)
- Structured logging with pino
- Graceful shutdown with SIGINT/SIGTERM handling
- Docker + docker-compose
- CI pipeline (lint + build + Docker build check)

---

## Architecture (High level)

Client → Express API → MongoDB (tasks)  
                      ↘ Redis + BullMQ (scheduled reminder jobs) → Worker → Mail provider (Stream/SMTP/Resend)

### Components

- **Express**: HTTP API server
- **TypeORM + MongoDB**: persistence
- **Redis + BullMQ**: queue, repeatable jobs, worker execution
- **Worker thread demo**: CPU heavy work off main event loop
- **Socket.IO**: realtime channel (optional for reminders but useful for live updates)

---

## Environment Variables

Create `.env`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

MONGO_URI=mongodb://localhost:27017/taskdb
REDIS_URL=redis://localhost:6379

MAIL_MODE=stream
REMINDER_TO=test@local.dev

# SMTP mode (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Resend mode (optional)
RESEND_API_KEY=
```

### MAIL_MODE notes

- **stream**: generates email content and logs it; no real delivery.
- **smtp**: sends real emails using SMTP credentials.
- **resend**: sends real emails through Resend HTTP API (recommended for deployment reliability).

---

## Local Development (without Docker)

```bash
npm install
npm run dev
```

---

## Run with Docker Compose

```bash
docker compose up --build
```

App: `http://localhost:3001`

---

## API Endpoints (sample)

- `GET /health`
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /cpu/blocking?n=3000000`
- `GET /cpu/worker?n=3000000`

---

## CI/CD

GitHub Actions workflow: `.github/workflows/ci.yml`

Runs on push/PR:
1. Install dependencies
2. Lint
3. Build
4. Docker image build validation

---

## Checkpoint Concepts (short answers)

### WebSockets vs HTTP
- HTTP is request/response.
- WebSocket is persistent bi-directional connection for realtime updates.

### Caching & invalidation
- Cache stores frequently-read results (usually in Redis).
- Invalidate cached keys on data update/create/delete to avoid stale reads.

### Worker thread vs cluster
- **worker_threads**: offload CPU-intensive tasks within same process.
- **cluster**: run multiple Node processes to use multiple CPU cores for throughput.

---
