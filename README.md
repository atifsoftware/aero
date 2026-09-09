<div align="center">
  <img src="./assets/aero_logo.jpg" alt="Aero MVC Logo" width="180" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);" />
  
  # 🚀 Aero MVC Framework
  
  <p><strong>Ultra-fast, Lightweight Enterprise MVC Engine for Node.js (Express 5)</strong></p>
  <p><em>Light as Air, Fast as Sound. High performance without the bloat.</em></p>
  <p><strong>⚡ Production-Ready E-commerce ERP Engine + Multi-Database (MySQL & PostgreSQL) + Bengali Unicode PDF Reporting!</strong></p>

  <p>
    <img src="https://img.shields.io/badge/version-2.1.0-blue.svg?style=flat-square" alt="Version" />
    <img src="https://img.shields.io/badge/node-≥20-green.svg?style=flat-square" alt="Node" />
    <img src="https://img.shields.io/badge/express-v5.2.1-orange.svg?style=flat-square" alt="Express 5" />
    <img src="https://img.shields.io/badge/tests-39%20passed%20(100%25)-brightgreen.svg?style=flat-square" alt="Tests" />
    <img src="https://img.shields.io/badge/security-hardened-brightgreen.svg?style=flat-square" alt="Security" />
    <img src="https://img.shields.io/badge/databases-MySQL%20%7C%20PostgreSQL-blueviolet.svg?style=flat-square" alt="Databases" />
    <img src="https://img.shields.io/badge/license-MIT-blueviolet.svg?style=flat-square" alt="License" />
  </p>
</div>

---

## ⚡ Features at a Glance

### 🛒 Enterprise E-commerce ERP Core Engines (NEW!)
Aero MVC provides enterprise-grade, battle-tested core modules engineered specifically for mission-critical E-commerce ERP, POS, and financial accounting systems:

- 📄 **HTML-to-PDF Reporting Engine (PHP mPDF Style - `core/Pdf.js`)**:
  - **Native Bengali Unicode & Ligatures**: Embedded Google Fonts (*Noto Sans Bengali*, *Kalpurush*, *SolaimanLipi*) and CSS OpenType feature shaping (`font-feature-settings: "kern" 1, "liga" 1`) ensures complex Bengali conjuncts (*ক্ষ, জ্ঞ, ঙ্গ, ঞ্চ, ষ্ণ*) render flawlessly without distortion.
  - **EJS Template Rendering**: Render dynamic invoices, delivery challans, and bills from EJS views via `Pdf.loadView('reports/invoice', data)`.
  - **Flexible Delivery**: Stream directly to browser download (`pdf.download(res)`), preview inline (`pdf.inline(res)`), export binary buffer (`pdf.toBuffer()`), or save to disk (`pdf.save(path)`).
- 🔤 **Number-to-Words Engine (বাংলা ও ইংরেজি - `core/NumberToWords.js`)**:
  - **Bengali Numerical System**: Full conversion for ০-৯৯, শত, হাজার, লক্ষ, এবং কোটি.
  - **Invoice & Cheque In-Words**: Automatic fractional/paisa amount formatting (e.g. `১৫০০.৫০` ➔ *"এক হাজার পাঁচ শত টাকা পঞ্চাশ পয়সা মাত্র"* / *"One Thousand Five Hundred Taka and Fifty Paisa Only"*).
  - Supports both South Asian (Lakh/Crore) and International (Million/Billion) number systems.
- 💾 **Automated Database Backup & Restore (`core/Backup.js`)**:
  - **Zero External Dependencies**: Pure Node.js streaming SQL dumper for both MySQL and PostgreSQL.
  - **Gzip Compression (`.sql.gz`)**: Reduces backup archive disk size by up to 95%.
  - **Retention Policy (Auto-Cleanup)**: Automatically rotates archives, keeping the latest N backups and safely pruning older files.
  - **CLI Management**: Easily run `node cli.js db:backup`, `node cli.js db:backups`, and `node cli.js db:restore`.
- 🔢 **Sequential Document Numbering Engine (`core/DocNumber.js`)**:
  - Concurrency-safe monotonic sequential voucher generation for Invoices, Purchase Orders, Delivery Challans, and Payment Receipts.
  - Flexible pattern formatting: `{PREFIX}-{YYYY}{MM}-{00001}` (e.g. `INV-202609-00001`), `{BRANCH}/{PREFIX}-{0001}` (e.g. `DHK/CH-0001`).
  - Configurable reset policies (`monthly`, `yearly`, `daily`, `never`) and legacy system sequence migration.
- 🕵️ **Audit Trail & State Diff Engine (`core/Audit.js`)**:
  - Automatic attribute difference detection (`Audit.diff(oldState, newState)`) capturing only changed values to prevent database bloat.
  - Tracks user ID, action (`CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`), IP address, user agent, and timestamp.
  - Full historical audit trail inspection via `Audit.getTrail(model, id)`.
- 📊 **Memory-Safe Streaming Export (`core/Export.js`)**:
  - Row-by-row HTTP streaming for massive datasets (50,000+ orders/ledger items) eliminating Node.js `heap out of memory` crashes.
  - **UTF-8 Byte Order Mark (BOM)**: Guarantees Microsoft Excel renders Bengali text and international characters properly without mojibake.
  - **CSV Formula Injection Defense**: Sanitizes cells prefixed with `=`, `+`, `-`, `@` against spreadsheet execution vulnerabilities.
- 🔒 **Pessimistic Row-Level Locking (`config/db.js`)**:
  - `qb.forUpdate()` and `qb.sharedLock()` for strict transactional concurrency control during inventory deductions and balance mutations.
- 🔁 **Deadlock Auto-Retry Engine (`DB.transaction(cb, { maxRetries: 3 })`)**:
  - Automatically intercepts MySQL `ER_LOCK_DEADLOCK` (1213) and PostgreSQL `40P01` deadlock codes and retries the transaction with exponential backoff.
- 🛡️ **Idempotency Protection Middleware (`middlewares/idempotency.js`)**:
  - Protects payment and checkout endpoints against duplicate requests, network retries, and double charging.
- 💰 **Precision Financial Math Engine (`core/Money.js`)**:
  - Zero floating-point arithmetic errors (`0.1 + 0.2 === 0.3`). Tax, VAT, percentage discounts, and fair-share remainder allocations.
- 🌐 **Global Query Scopes (`core/Model.js`)**:
  - Multi-tenant and multi-branch data isolation (e.g. `branch_id`, soft-deletes) applied automatically across queries.
- ⏰ **Enterprise Task Scheduler (`core/Scheduler.js`)**:
  - Cron-style task scheduler with CLI execution (`schedule:run`, `schedule:list`) for automated recurring tasks.

---

### 🔥 Core Framework Features
- **🚀 Express.js 5 Engine**: Zero-bloat, procedural MVC architecture with instant boot (~300ms).
- **🗄️ Fluent Query Builder (`config/db.js`)**: Custom SQL-injection-safe QueryBuilder with transaction support, pagination, chunking, and slow query profiling.
- **🔄 Multi-Database Support**: Auto-detect MySQL or PostgreSQL with seamless switching via `.env` configuration.
- **🚦 RFC-Compliant Rate Limiting (`core/Throttle.js`)**: Sliding-window rate limiter with Redis/memory support and standard `RateLimit-*` RFC headers.
- **🔑 Personal Access Tokens (`core/HasApiTokens.js`)**: Laravel Sanctum-inspired secure token lifecycle (`aero_pat_`) with configurable expiration and refresh logic.
- **📬 Multi-Channel Notifications (`core/Notification.js`)**: Unified notification dispatcher across SMTP (Nodemailer), SMS (Twilio/Webhook), and Database.
- **⚡ Hybrid Caching Engine (`core/Cache.js`)**: High-performance multi-tier cache utilizing distributed Redis with zero-downtime file-based fallback.
- **📨 Persistent Job Queue (`core/Queue.js`)**: Reliable MySQL-backed background worker with delayed dispatching, retry logic, and failed job archival.
- **🛡️ Security & Auth**: Session Auth, JWT, CSRF protection, Gate permission policies, and Helmet security headers.
- **💎 Prisma ORM Integration**: Optional Prisma schema modeling and Prisma Studio support.
- **💻 Interactive CLI (`node cli.js`)**: 26+ developer commands for scaffolding models, controllers, migrations, running tests, database backup/restore, and managing queues.
- **📘 Swagger OpenAPI Portal**: Built-in API documentation explorer at `/api/docs`.
- **🧪 DB-Sandboxed Testing**: Zero-dependency assert testing framework running tests inside auto-rolled-back transactions.

---

## 🏗️ Architecture Overview

```text
Aero MVC Engine
├── apps/
│   ├── backend/          # Express 5 MVC Core Backend
│   │   ├── config/       # Database & Swagger Configurations
│   │   │   └── db.js     # QueryBuilder, Locking, Deadlock Retry, Multi-DB
│   │   ├── controllers/  # Business & API Controllers
│   │   ├── core/         # Framework Core Engines
│   │   │   ├── Audit.js        # Audit Trail & Compliance Logger
│   │   │   ├── Backup.js       # MySQL & PostgreSQL Gzip Dumper
│   │   │   ├── DocNumber.js    # Sequential Document Code Generator
│   │   │   ├── Export.js       # Memory-Safe Streaming CSV/Excel
│   │   │   ├── Money.js        # Zero Floating-Point Financial Math
│   │   │   ├── NumberToWords.js# Bengali & English Words Converter
│   │   │   ├── Pdf.js          # HTML-to-PDF Engine with Bengali Fonts
│   │   │   ├── Scheduler.js    # Cron-Style Task Scheduler
│   │   │   ├── Cache.js, Queue.js, Mailer.js, Sms.js, etc.
│   │   ├── middlewares/  # Interceptors (Idempotency, Auth, RateLimiting, etc.)
│   │   ├── models/       # Active Record Models with Global Scopes
│   │   ├── routes/       # Web & API Route Definitions
│   │   ├── tests/        # 39 DB-Sandboxed Automated Test Suites
│   │   └── views/        # EJS View Templates & PDF Reports
│   │       └── reports/  # Bilingual Invoice & Bill Templates
│   └── web/              # Next.js 14 React Single-Page Application (Admin Panel)
│       └── src/app/admin/# Enterprise Admin Dashboard, POS & Inventory UI
├── database/
│   ├── migrations/       # Timestamped Schema Migrations (10+ ERP tables)
│   └── seeders/          # Sample Database Seeders
├── storage/
│   ├── backups/          # Compressed Database Archives (.sql.gz)
│   ├── cache/            # Local JSON cache fallback
│   └── logs/             # Correlated application & error logs
├── cli.js                # Aero Interactive CLI (26+ Commands)
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

Update your database credentials in `apps/backend/.env`:
```env
# Choose your database type: 'mysql' or 'postgresql'
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306           # 5432 for PostgreSQL
DB_USER=root
DB_PASS=your_password
DB_NAME=aero_erp_db

# Or use connection URL
DATABASE_URL=mysql://root:password@localhost:3306/aero_erp_db
# DATABASE_URL=postgresql://user:pass@localhost:5432/aero_erp_db
```

### 3. Setup Database & Migrations
```bash
# Create database and run all migrations
node apps/backend/cli.js 1

# Seed initial sample data (including e-commerce demo data)
node apps/backend/cli.js 2
```

### 4. Start Development Server
```bash
npm run dev
```

**Access Points:**
- 🌐 **Web Admin Panel (Next.js 14)**: `http://localhost:3000/`
- 🔌 **API Backend (Express 5 MVC)**: `http://localhost:3001/`
- 📖 **API Explorer (Swagger Docs)**: `http://localhost:3001/api/docs`
- 💾 **Database Studio (Prisma)**: `npx prisma studio`

---

## 🗄️ Multi-Database Support (MySQL & PostgreSQL)

Aero MVC natively supports **both MySQL and PostgreSQL** with unified syntax and zero code changes:

```javascript
const DB = require('./config/db');

// Automatic dialect escaping and placeholder conversion
const products = await DB.table('products')
  .select('id', 'name', 'price', 'stock')
  .where('stock', '>', 0)
  .forUpdate() // Pessimistic row locking
  .get();

// Deadlock-resilient transactional execution
await DB.transaction(async (trx) => {
  const orderId = await trx.table('orders').insert({
    customer_id: 1,
    status: 'paid',
    total_amount: 1500.00
  });

  await trx.table('inventory_movements').insert({
    product_id: 5,
    quantity: -2,
    type: 'sale'
  });
}, { maxRetries: 3 });
```

---

## 📑 ERP Core Modules Code Examples

### 1. HTML-to-PDF Reporting (with Bengali Unicode)
```javascript
const { Pdf, currencyWords } = require('./core/helpers');

// Render PDF invoice from EJS template with customer & item data
const pdf = await Pdf.loadView('reports/invoice', {
  company: { name: 'Aero E-Commerce Ltd.', phone: '+880 1700-000000', bin: '001234567-0101' },
  customer: { name: 'আহমেদ হাসান', address: 'মিরপুর, ঢাকা' },
  invoice: { number: 'INV-202609-0001', date: '2026-09-09' },
  items: [
    { name: 'Wireless Ergonomic Keyboard', quantity: 2, price: 2500 }
  ],
  summary: { subtotal: 5000, discount: 0, tax: 250, total: 5250 },
  wordsBn: currencyWords(5250, { language: 'bn', currency: 'BDT' }),
  wordsEn: currencyWords(5250, { language: 'en', currency: 'BDT' })
});

// Stream directly to browser download
await pdf.download(res, 'Invoice-202609-0001.pdf');
```

### 2. Number-to-Words & Invoice Currency Formatting
```javascript
const { NumberToWords } = require('./core/helpers');

// Bengali words
NumberToWords.toBangla(12550);
// => "বারো হাজার পাঁচ শত পঞ্চাশ"

// Bengali invoice amount
NumberToWords.toCurrencyWords(1500.50, { language: 'bn', currency: 'BDT' });
// => "এক হাজার পাঁচ শত টাকা পঞ্চাশ পয়সা মাত্র"

// English invoice amount
NumberToWords.toCurrencyWords(1500.50, { language: 'en', currency: 'BDT' });
// => "One Thousand Five Hundred Taka and Fifty Paisa Only"
```

### 3. Sequential Document Numbering
```javascript
const { DocNumber } = require('./core/helpers');

// Generate next monthly invoice number
const invNo = await DocNumber.next('invoice', {
  prefix: 'INV',
  format: '{PREFIX}-{YYYY}{MM}-{00001}',
  reset: 'monthly'
});
// => "INV-202609-00001"
```

### 4. Database Backup & Restore via CLI
```bash
# Create compressed backup (.sql.gz)
node apps/backend/cli.js db:backup

# List all stored backups with size and timestamp
node apps/backend/cli.js db:backups

# Interactive backup restoration
node apps/backend/cli.js db:restore
```

---

## 🧪 Running Automated Tests

Aero includes **39 DB-sandboxed automated test suites** covering core framework and all ERP engines:

```bash
npm --prefix apps/backend test
```

*Or via CLI:*
```bash
node apps/backend/cli.js 14
```

```
╔════════════════════════════════════════════╗
║            AERO AUTOMATED TESTS            ║
╚════════════════════════════════════════════╝

✓ API Status, Settings, and Token Authentication Workflow
✓ QueryBuilder SQL compilation & methods
✓ Hybrid Cache (Set, Get, Has, Remember, Forget)
✓ Validator engine (sync & async validation)
✓ Queue broker push and stats
✓ ApiResponse decorator and pagination format
✓ Prisma Client singleton & schema models reflection
✓ Enterprise Rate Limiting - Granular sliding window & RFC headers
✓ Enterprise Rate Limiting - Presets (auth, api, strict)
✓ Token Expiry & Lifecycle - Duration Parser & Datetime Formatter
✓ Token Expiry Middleware - Expired Token Rejection & Error Codes
✓ Notifications - Mailer Service (Sandbox & Formatting)
✓ Notifications - SMS Service (Sandbox & Formatting)
✓ Notifications - Multi-Channel Dispatcher (Notification Bus)
✓ Type Safety & Global Framework Contracts
✓ ERP Advanced - NumberToWords English System
✓ ERP Advanced - NumberToWords Bengali System
✓ ERP Advanced - Currency In-Words for Cheques & Invoices
✓ ERP Advanced - PDF Engine & Bengali Font Injection
✓ ERP Advanced - Sequential Document Numbering
✓ ERP Advanced - Audit Trail & State Diff Engine
✓ ERP Advanced - Memory-Safe Streaming Export
✓ ERP Advanced - Database Backup Directory & List
✓ ERP Models - Relationship Reflection & Architecture
✓ Multi-DB & Knex Integration - Migrator Schema Engine
✓ QueryBuilder - Dialect Escaping & Postgres Placeholder Logic
✓ ERP Core - Pessimistic Row-Level Locking
✓ ERP Core - Deadlock Auto-Retry Resilience
✓ ERP Core - Idempotency Protection
✓ ERP Core - Event Dispatcher & Wildcard Observer Bus
✓ ERP Core - Financial Precision (Zero Floating-Point Error)
✓ ERP Core - Global Query Scopes & Multi-Branch Isolation
✓ ERP Core - Automated Task Scheduler
✓ Security Hardening - CSRF Timing-Safe Protection
✓ Security Hardening - QueryBuilder Mass Mutation Guards
✓ Security Hardening - toRawSql() Secure Escaping & Pattern Safety
✓ Security Hardening - Helpers XSS & Crypto Random Integrity
✓ Settings DB Persistence & Cache Integrity
✓ User Management ORM CRUD Integrity

─────────────────────────────────────────────
📊 Test Results: 39 Passed | 0 Failed (100%)
─────────────────────────────────────────────
```

---

## 🛠️ CLI Commands

Aero provides **26 interactive CLI commands**:

```bash
node apps/backend/cli.js

# Available Options:
1  - Database Setup (Initialize Schema & Admin User)
2  - Database Seed (Sample Users & ERP Data)
3  - View All Database Tables
4  - Generate Model Scaffold
5  - Generate Controller Scaffold
6  - Run All Seeders (db:seed)
7  - Generate Seeder Scaffold (make:seeder)
8  - Clear Application Cache (cache:clear)
9  - Framework Status Overview (app:status)
10 - Run Database Migrations (db:migrate)
11 - Generate Migration Scaffold (make:migration)
12 - Launch Background Queue Worker (queue:work)
13 - Launch Interactive Tinker REPL (tinker)
14 - Run Automated Framework Tests (test)
15 - View Failed Queue Jobs (queue:failed)
16 - Retry Failed Queue Job (queue:retry)
17 - Generate Middleware Scaffold (make:middleware)
18 - Generate Background Job Scaffold (make:job)
19 - Launch Prisma Studio Web GUI (prisma:studio)
20 - Regenerate Prisma Client (prisma:generate)
21 - Push Prisma Schema to Database (prisma:db:push)
22 - Run Due Scheduled Tasks (schedule:run)
23 - List Scheduled Tasks (schedule:list)
24 - Create Database Backup (db:backup)
25 - List Database Backups (db:backups)
26 - Restore Database Backup (db:restore)
0  - Exit
```

---

## 🌟 Recommended Frontend Architecture

For enterprise ERP applications built on Aero MVC:
- **Admin Dashboard, POS, Inventory & Order Management**: Build in **React (`apps/web/src/app/admin`)** for lightning-fast Single-Page Application (SPA) user experience, dynamic real-time state, and rich data tables.
- **Document & Print Generation**: Build in **EJS (`apps/backend/views`)** for server-side HTML-to-PDF invoice rendering and transactional emails.

---

## 📄 License

The Aero Framework is open-sourced software licensed under the [MIT license](LICENSE).

<div align="center">
  <strong>Built with ❤️ by the Aero Team</strong>
  <br/>
  <em>Light as Air, Fast as Sound 🚀</em>
</div>
