# 🚀 Aero MVC Framework

<div align="center">
  <h3>Ultra-fast, Lightweight Enterprise MVC Engine for Node.js (Express 5)</h3>
  <p>Light as Air, Fast as Sound. High performance without the bloat.</p>
</div>

---

## ⚡ Features at a Glance

- **🚀 Express.js 5 Engine**: Zero-bloat, procedural MVC architecture with instant boot (~300ms).
- **🗄️ Fluent Query Builder (`config/db.js`)**: 714-line custom SQL-injection-safe QueryBuilder with transaction support, pagination, chunking, and slow query profiling.
- **🚦 RFC-Compliant Rate Limiting (`core/Throttle.js`)**: Sliding-window rate limiter with Redis/memory support and standard `RateLimit-*` RFC headers.
- **🔑 Personal Access Tokens (`core/HasApiTokens.js`)**: Laravel Sanctum-inspired secure token lifecycle (`aero_pat_`) with configurable expiration and refresh logic.
- **📬 Multi-Channel Notifications (`core/Notification.js`)**: Unified notification dispatcher across SMTP (Nodemailer), SMS (Twilio/Webhook), and Database.
- **⚡ Hybrid Caching Engine (`core/Cache.js`)**: High-performance multi-tier cache utilizing distributed Redis with zero-downtime file-based fallback.
- **📨 Persistent Job Queue (`core/Queue.js`)**: Reliable MySQL-backed background worker with delayed dispatching, retry logic, and failed job archival.
- **🛡️ Security & Auth**: Session Auth, JWT, CSRF protection, Gate permission policies, and Helmet security headers.
- **💎 Prisma ORM Integration**: Optional Prisma schema modeling and Prisma Studio support.
- **💻 Interactive CLI (`node cli.js`)**: 21 developer commands for scaffolding models, controllers, migrations, running tests, and managing queues.
- **📘 Swagger OpenAPI Portal**: Built-in API documentation explorer at `/api/docs`.
- **🧪 DB-Sandboxed Testing**: Zero-dependency assert testing framework running tests in rolled-back transactions.

---

## 🏗️ Architecture Overview

```text
Aero MVC Engine
├── apps/backend/
│   ├── controllers/      # Business Controllers (Vouchers, Customers, HR, etc.)
│   ├── core/             # Framework Engine (DB, Cache, Queue, Validator, Logger, Throttle, Mailer)
│   ├── middlewares/      # Interceptors (validate, apiResponse, auth, apiCan, apiTokenAuth)
│   ├── models/           # Active Record Models
│   ├── routes/           # Web & API Route Definitions
│   ├── services/         # Integrations (Gemini AI, ImageProcessor)
│   └── views/            # EJS Server-Side Rendered Templates
├── config/
│   ├── db.js             # Fluent QueryBuilder + Pool Connection
│   └── swagger.js        # OpenAPI Documentation
├── database/
│   ├── migrations/       # Timestamped Schema Migrations
│   └── seeders/          # Database Seeders
├── storage/
│   ├── cache/            # Local JSON cache fallback
│   └── logs/             # Correlated application & error logs
├── types/
│   └── index.d.ts        # Full JSDoc & TypeScript Type Contracts
├── cli.js                # Aero Interactive CLI
└── server.js             # Application Server Entrypoint
```

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone https://github.com/atifsoftware/aero.git
cd aero
npm install
```

### 2. Configure Environment
```bash
cp apps/backend/.env.example apps/backend/.env
```
Update your database credentials in `apps/backend/.env`.

### 3. Setup Database & Seeders
```bash
node cli.js 1   # Initialize schema & database
node cli.js 2   # Seed initial sample data
```

### 4. Start Development Server
```bash
npm run dev
```
- Web Application: `http://localhost:3001/`
- API Explorer: `http://localhost:3001/api/docs`

---

## 🧪 Running Tests

Aero includes 17 DB-sandboxed automated test suites:
```bash
npm test
```
*Or via CLI:*
```bash
node cli.js 14
```

---

## 📄 License

The Aero Framework is open-sourced software licensed under the [MIT license](LICENSE).
