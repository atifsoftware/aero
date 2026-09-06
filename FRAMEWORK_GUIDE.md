# 🚀 NodeFlow Framework — Supercharged Core Guide

**NodeFlow** is a high-performance, lightweight Enterprise MVC Framework for **Node.js (Express 4)** with **Custom Fluent Query Builder (`config/db.js`)**, **Raw SQL**, **Redis Hybrid Cache**, **MySQL Persistent Queue**, and **Google Gemini AI**.

---

## 🏗️ Architecture Overview

```text
NodeFlow MVC Engine
├── app/
│   ├── controllers/      # Business Controllers (Vouchers, Customers, HR, etc.)
│   ├── core/             # Framework Core (DB, Cache, Queue, Validator, Logger, Model)
│   ├── middlewares/      # Request Interceptors (validate, apiResponse, auth, apiCan)
│   ├── models/           # Active Record Models
│   ├── services/         # Integrations (Gemini AI, ImageProcessor)
│   └── jobs/             # Asynchronous Queue Jobs
├── config/
│   ├── db.js             # Fluent QueryBuilder + MySQL Connection Pool
│   └── swagger.js        # OpenAPI Specification
├── database/
│   ├── migrations/       # Timestamped Schema Migrations
│   └── seeders/          # Database Seeders
├── storage/
│   ├── cache/            # File-based cache fallback
│   └── logs/             # Correlated error & application logs
├── cli.js                # Interactive Command-Line Interface 3.0
├── docker-compose.yml    # Full-Stack Multi-Container Orchestration
└── server.js             # Express Engine Entrypoint
```

---

## 🗄️ 1. Database & Fluent Query Builder (`config/db.js`)

NodeFlow's QueryBuilder allows writing elegant, SQL-injection-safe queries while retaining the full speed of MySQL.

### Dynamic Connection & Auto-Database Creation
NodeFlow dynamically parses `DATABASE_URL` (e.g. `mysql://root:pass@localhost:3306/my_db`) or discrete `DB_*` environment variables. On boot, it automatically runs `CREATE DATABASE IF NOT EXISTS` so fresh environments launch without manual phpMyAdmin setup.

### Basic Queries
```javascript
const DB = require('./config/db');

// SELECT * FROM `users` WHERE `status` = 1
const activeUsers = await DB.table('users').where('status', 1).get();

// Find single record by ID
const user = await DB.table('users').find(42);

// Direct raw SQL query
const rows = await DB.query("SELECT * FROM `tbl_vouchers` WHERE `amount` > ?", [5000]);
```

### Advanced Query Methods
```javascript
// Pagination (Returns { data: [...], pagination: { total, per_page, current_page, last_page, ... } })
const paginated = await DB.table('users')
  .where('status', 1)
  .paginate(req.query.page, 15);

// Where Between / Not Between
const orders = await DB.table('orders')
  .whereBetween('created_at', ['2026-01-01', '2026-12-31'])
  .get();

// Where Null / Not Null
const unassigned = await DB.table('tasks').whereNull('assigned_to').get();

// Pluck column values
const emailList = await DB.table('users').pluck('email');

// Check existence without loading entire rows
if (await DB.table('users').where('email', email).exists()) {
  // User exists
}

// Memory-safe chunking for large datasets
await DB.table('large_logs').chunk(500, async (records, page) => {
  console.log(`Processing page ${page} with ${records.length} records...`);
});
```

### Slow Query Profiling
Queries exceeding `SLOW_QUERY_THRESHOLD_MS` (default: `100ms`) are automatically audited and logged with their exact execution time in milliseconds and bound parameters.

---

## ⚡ 2. High-Performance Hybrid Cache (`app/core/Cache.js`)

NodeFlow features a **Hybrid Caching Engine**:
- **Redis (`ioredis`)**: Automatically utilized when Redis is configured and reachable.
- **Zero-Downtime Fallback**: If Redis is not running, NodeFlow automatically falls back to local file-based JSON caching in `storage/cache/` without crashing.

```javascript
const Cache = require('./app/core/Cache');

// Store value with 60 seconds TTL
await Cache.set('site_settings', { theme: 'dark', currency: 'BDT' }, 60);

// Retrieve cached value (or default if expired)
const settings = await Cache.get('site_settings', { theme: 'light' });

// Cache remember: Fetch from cache, or execute async callback on miss and cache result
const summary = await Cache.remember('today_summary', 300, async () => {
  return await DB.table('tbl_vouchers').sum('amount');
});

// Remove from cache
await Cache.forget('site_settings');

// Clear all cache (both Redis and files)
await Cache.clear();
```

---

## 📨 3. Persistent Background Queue & Failed Jobs (`app/core/Queue.js`)

Run heavy operations (e.g. emails, PDF generation, data processing) asynchronously in the background.

### Dispatching a Job
```javascript
const Queue = require('./app/core/Queue');
const SendWelcomeEmail = require('./app/jobs/SendWelcomeEmail');

// Dispatch job to default queue
await Queue.dispatch(new SendWelcomeEmail({ userId: 1, email: 'admin@nodeflow.com' }));

// Dispatch with delay (e.g. 60 seconds)
await Queue.dispatch(new SendWelcomeEmail(payload), 'high_priority', 60);
```

### Running the Queue Worker
```bash
# Via interactive CLI
node cli.js 12

# Or directly
node -e "new (require('./app/core/QueueWorker'))().work();"
```

### Failed Jobs Archival
When a job exceeds its maximum attempts (`tries = 3`), it is automatically moved to the `failed_jobs` table along with its stack trace and timestamp. You can inspect and retry failed jobs anytime via `cli.js` (Option 15 & 16).

---

## 🛡️ 4. Declarative Request Validation (`app/middlewares/validate.js`)

Validate requests effortlessly with declarative middleware:

```javascript
const validate = require('../middlewares/validate');

router.post('/expenses', validate({
  amount: 'required|numeric|min:1',
  category_id: 'required|integer',
  account_id: 'required|integer',
  note: 'string|max:255'
}), VoucherController.createExpense);
```
- For API clients: Intercepts invalid requests and responds with standard `HTTP 422 Unprocessable Entity` containing field errors in Bengali/English.
- For web sessions: Automatically stores flash errors and old input and redirects back.

---

## 📡 5. Unified API Responses (`res.success`, `res.error`, `res.paginate`)

Every route handler has access to standardized response helpers:

```javascript
// Success response with auto-calculated execution time
return res.success(data, 'Operation completed successfully');

// Error response
return res.error('Insufficient account balance', 400);

// Paginated response
const paginated = await DB.table('users').paginate(req.query.page, 15);
return res.paginate(paginated);
```

Example JSON output:
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-06T15:20:00.000Z",
    "execution_time_ms": 12
  }
}
```

---

## 🤖 6. Google Gemini AI Engine (`app/services/Gemini.js` & `AiController.js`)

Native HTTPS communication with Google Gemini Flash:

### Endpoints
- `POST /api/ai/ask`: Interactive assistant query with optional context.
- `POST /api/ai/summarize`: Automated business intelligence and KPI summary.

```javascript
const Gemini = require('./app/services/Gemini');
const gemini = new Gemini();

// Ask questions with context
const answer = await gemini.askAssistant('How to optimize our inventory?', currentStockData);

// Summarize financial KPIs
const summary = await gemini.summarizeMetrics(todayMetrics);
```

---

## 🐳 7. Docker & DevOps Orchestration

Run the entire stack (Node.js + MySQL 8 + Redis + phpMyAdmin) in one command:

```bash
docker compose up -d
```

- **App Server**: `http://localhost:3000`
- **phpMyAdmin**: `http://localhost:8080`
- **MySQL Port**: `3306`
- **Redis Port**: `6379`

---

## 💻 8. Interactive CLI Tool 3.0 (`node cli.js`)

Run `node cli.js` to access 18 interactive developer commands:
- **1-3**: Database Setup, Seed, & Table Browser
- **4-5**: Model & Controller Scaffolding (`make:model`, `make:controller`)
- **6-7**: Seeder Engine & Scaffolding (`db:seed`, `make:seeder`)
- **8**: Application Cache Clear (`cache:clear` - flushes Redis & files)
- **9**: Framework Diagnostics Overview (`app:status`)
- **10-11**: Database Migrations & Scaffold (`db:migrate`, `make:migration`)
- **12**: Background Queue Worker (`queue:work`)
- **13**: Interactive Tinker REPL (`tinker`)
- **14**: Automated DB-Sandboxed Tests (`test`)
- **15**: View Failed Queue Jobs (`queue:failed`)
- **16**: Retry Failed Queue Job (`queue:retry`)
- **17**: Generate Middleware Scaffold (`make:middleware`)
- **18**: Generate Background Job Scaffold (`make:job`)
