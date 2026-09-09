# Multi-Database Support in Aero MVC

Aero MVC now supports both **MySQL** and **PostgreSQL** databases with automatic detection and seamless switching. This makes it perfect for enterprise applications like E-commerce ERP systems where you might need different database backends.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [How It Works](#how-it-works)
5. [Usage Examples](#usage-examples)
6. [Migration Support](#migration-support)
7. [Best Practices](#best-practices)
8. [Limitations](#limitations)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Multi-Database Support?

Different databases have different strengths:

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| **Best For** | Read-heavy operations, simple queries | Complex queries, data integrity |
| **Performance** | Fast reads, simple writes | Complex joins, transactions |
| **Data Types** | Standard types | Advanced types (JSONB, Arrays, UUID) |
| **Concurrency** | Good | Excellent |
| **E-commerce** | ✅ Excellent | ✅ Excellent |

### Auto-Detection Methods

The framework automatically detects your database type using three methods (in order of priority):

1. **DATABASE_URL** - Protocol detection (`mysql://` vs `postgresql://`)
2. **DB_TYPE** - Explicit configuration in `.env`
3. **DB_PORT** - Auto-detect by port (3306=MySQL, 5432=PostgreSQL)

---

## Installation

### Step 1: Install PostgreSQL Driver

```bash
cd apps/backend
npm install pg
```

**Note:** MySQL driver (`mysql2`) is already installed by default.

### Step 2: Verify Installation

```bash
npm list mysql2 pg
```

You should see both drivers in the output.

---

## Configuration

### Method 1: Using DB_TYPE Environment Variable (Recommended)

Create or update your `.env` file:

**For MySQL:**
```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=aero_erp_db
DB_CHARSET=utf8mb4
DB_COLLATE=utf8mb4_unicode_ci
```

**For PostgreSQL:**
```env
DB_TYPE=postgresql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=aero_erp_db
DB_SSL=false
```

### Method 2: Using DATABASE_URL

**For MySQL:**
```env
DATABASE_URL=mysql://root:password@localhost:3306/aero_erp_db
```

**For PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/aero_erp_db?ssl=false
```

### Method 3: Auto-Detection by Port

If you don't specify `DB_TYPE` or `DATABASE_URL`, the framework will auto-detect based on the port:

```env
DB_HOST=127.0.0.1
DB_PORT=3306  # Automatically uses MySQL
DB_USER=root
DB_PASS=
DB_NAME=aero_erp_db
```

```env
DB_HOST=127.0.0.1
DB_PORT=5432  # Automatically uses PostgreSQL
DB_USER=postgres
DB_PASS=password
DB_NAME=aero_erp_db
```

---

## How It Works

### Automatic Identifier Escaping

The framework automatically handles identifier escaping based on the database type:

- **MySQL**: Uses backticks (\`)
  ```sql
  SELECT * FROM `users` WHERE `active` = 1
  ```

- **PostgreSQL**: Uses double quotes (")
  ```sql
  SELECT * FROM "users" WHERE "active" = 1
  ```

### Parameter Placeholder Conversion

Query parameters are automatically converted:

- **MySQL**: Uses `?` placeholders
  ```javascript
  db.query('SELECT * FROM users WHERE id = ?', [1])
  // Executes: SELECT * FROM `users` WHERE `id` = ?
  ```

- **PostgreSQL**: Uses `$1`, `$2`, `$3` placeholders
  ```javascript
  db.query('SELECT * FROM users WHERE id = ?', [1])
  // Executes: SELECT * FROM "users" WHERE "id" = $1
  ```

### Result Normalization

Both databases return results in the same format:

```javascript
const users = await db.table('users').get();
// Returns: [{ id: 1, name: 'John' }, ...] for both MySQL and PostgreSQL
```

### Connection Pool Management

The framework maintains separate connection pools for each database type:

- **MySQL**: Uses `mysql2/promise` pool
- **PostgreSQL**: Uses `pg.Pool`

Connections are automatically closed on application shutdown.

---

## Usage Examples

### Basic Queries

All Query Builder methods work seamlessly with both databases:

```javascript
const db = require('./config/db');

// Select with conditions
const activeUsers = await db.table('users')
  .select('id', 'name', 'email')
  .where('active', 1)
  .where('role', 'customer')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .get();

// Insert
const userId = await db.table('users').insert({
  name: 'John Doe',
  email: 'john@example.com',
  active: 1
});

// Update
await db.table('users')
  .where('id', userId)
  .update({ email: 'newemail@example.com' });

// Delete
await db.table('users')
  .where('id', userId)
  .delete();
```

### Joins

```javascript
const orders = await db.table('orders')
  .select('orders.id', 'customers.name', 'orders.total')
  .join('customers', 'orders.customer_id', '=', 'customers.id')
  .where('orders.status', 'pending')
  .get();
```

### Transactions

```javascript
await db.transaction(async (trx) => {
  const orderId = await trx.table('orders').insert({
    customer_id: 1,
    total: 100,
    status: 'pending'
  });

  await trx.table('order_items').insert({
    order_id: orderId,
    product_id: 5,
    quantity: 2,
    price: 50
  });

  // If any query fails, all changes are rolled back
});
```

### Raw Queries

```javascript
// MySQL or PostgreSQL - works the same
const result = await db.query(
  'SELECT COUNT(*) as total FROM users WHERE active = ?',
  [1]
);

console.log(result[0].total);
```

---

## Migration Support

### Creating Migrations

Migrations work with both databases. The framework automatically generates appropriate SQL:

```bash
node aero make:migration create_products_table
```

Example migration file:

```javascript
module.exports = {
  up: async (db) => {
    await db.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.decimal('price', 10, 2);
      table.integer('stock').defaultTo(0);
      table.timestamps();
    });
  },

  down: async (db) => {
    await db.schema.dropTable('products');
  }
};
```

### Running Migrations

```bash
# Run all pending migrations
node aero migrate

# Rollback last batch
node aero migrate:rollback

# Check migration status
node aero migrate:status
```

### Database-Specific Considerations

#### MySQL
- Auto-increment columns work out of the box
- Database is automatically created if it doesn't exist

#### PostgreSQL
- You must manually create the database before running migrations:
  ```sql
  CREATE DATABASE aero_erp_db;
  ```
- Use `SERIAL` or `IDENTITY` for auto-increment columns
- Consider using UUID for primary keys in distributed systems

---

## Best Practices

### For E-commerce ERP Systems

#### When to Use MySQL:
- Simple product catalogs
- High read traffic
- Standard e-commerce operations
- Team more familiar with MySQL

#### When to Use PostgreSQL:
- Complex inventory management
- Advanced reporting and analytics
- JSON data storage (product attributes)
- Need for advanced data types (arrays, UUID)
- Complex transactions and constraints

### Configuration Tips

1. **Use Connection Pooling**: Already enabled by default
   ```env
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   ```

2. **Enable SSL for Production** (PostgreSQL):
   ```env
   DB_SSL=true
   DB_SSL_CA=/path/to/ca-cert.pem
   ```

3. **Set Appropriate Timeouts**:
   ```env
   DB_CONNECT_TIMEOUT=10000
   DB_ACQUIRE_TIMEOUT=30000
   ```

4. **Use Environment-Specific Configs**:
   ```env
   # .env.development
   DB_HOST=localhost
   DB_PASS=dev_password

   # .env.production
   DB_HOST=db.example.com
   DB_PASS=secure_production_password
   ```

### Performance Optimization

1. **Index Frequently Queried Columns**:
   ```javascript
   table.index('customer_id');
   table.index(['status', 'created_at']);
   ```

2. **Use Pagination**:
   ```javascript
   const products = await db.table('products')
     .limit(20)
     .offset((page - 1) * 20)
     .get();
   ```

3. **Cache Expensive Queries**:
   ```javascript
   const stats = await cache.remember('sales_stats', 3600, async () => {
     return await db.query('SELECT SUM(total) FROM orders');
   });
   ```

---

## Limitations

### Known Limitations

1. **Auto Database Creation**:
   - ✅ MySQL: Automatically creates database if it doesn't exist
   - ❌ PostgreSQL: Must create database manually

2. **Advanced SQL Features**:
   - Some database-specific features may not be available through the query builder
   - Use raw queries for advanced features:
     ```javascript
     // PostgreSQL-specific: JSONB operations
     const result = await db.query(
       'SELECT * FROM products WHERE attributes @> ?',
       [{ color: 'red' }]
     );
     ```

3. **Data Type Differences**:
   - MySQL `TINYINT(1)` ↔ PostgreSQL `BOOLEAN`
   - MySQL `DATETIME` ↔ PostgreSQL `TIMESTAMP`
   - MySQL `TEXT` ↔ PostgreSQL `TEXT`

4. **Case Sensitivity**:
   - MySQL: Case-insensitive by default (depends on collation)
   - PostgreSQL: Case-sensitive for identifiers

### Workarounds

For PostgreSQL-specific features, use raw queries:

```javascript
// PostgreSQL ARRAY operations
const tags = await db.query(
  'SELECT * FROM products WHERE ? = ANY(tags)',
  [['electronics']]
);

// PostgreSQL JSONB operations
const products = await db.query(
  `SELECT * FROM products 
   WHERE attributes->>'color' = ?`,
  ['red']
);
```

---

## Troubleshooting

### Common Issues

#### 1. "Connection refused" Error

**Solution:**
- Check if database server is running
- Verify host and port in `.env`
- Check firewall settings

```bash
# MySQL
mysql -u root -p

# PostgreSQL
psql -U postgres
```

#### 2. "Database does not exist" (PostgreSQL)

**Solution:**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE aero_erp_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aero_erp_db TO postgres;
```

#### 3. "Authentication failed" Error

**Solution:**
- Verify username and password in `.env`
- Check database user permissions
- For PostgreSQL, check `pg_hba.conf` authentication method

#### 4. Slow Queries

**Solution:**
- Add indexes to frequently queried columns
- Use query caching
- Analyze slow query logs:
  ```sql
  -- MySQL
  SET GLOBAL slow_query_log = 'ON';
  
  -- PostgreSQL
  ALTER SYSTEM SET log_min_duration_statement = 1000;
  ```

#### 5. Character Encoding Issues

**Solution:**
```env
# MySQL
DB_CHARSET=utf8mb4
DB_COLLATE=utf8mb4_unicode_ci

# PostgreSQL
# UTF-8 is default, no additional config needed
```

### Debug Mode

Enable debug mode to see all queries:

```javascript
// In config/db.js, set:
debug: true
```

Or temporarily in your code:

```javascript
db.on('query', (query) => {
  console.log('Executing:', query.sql, query.bindings);
});
```

### Testing Connection

```bash
# Test database connection
node -e "require('./config/db').then(() => console.log('✅ Connected!')).catch(console.error);"
```

---

## Switching Between Databases

### Quick Switch Guide

1. Stop your application
2. Update `.env` file:
   ```env
   # Switch to MySQL
   DB_TYPE=mysql
   DB_PORT=3306
   
   # OR switch to PostgreSQL
   DB_TYPE=postgresql
   DB_PORT=5432
   ```
3. Ensure the target database exists and is running
4. Run migrations: `node aero migrate`
5. Start application: `npm start`

### Running Both Databases Simultaneously

You can configure multiple database connections:

```javascript
// config/database.js
module.exports = {
  mysql: {
    client: 'mysql2',
    connection: { /* MySQL config */ }
  },
  postgres: {
    client: 'pg',
    connection: { /* PostgreSQL config */ }
  }
};
```

Then use specific connections in your models:

```javascript
const mysqlDB = db.connection('mysql');
const pgDB = db.connection('postgres');
```

---

## Conclusion

Aero MVC's multi-database support gives you the flexibility to choose the best database for your e-commerce ERP system. Whether you need MySQL's simplicity and speed or PostgreSQL's advanced features and data integrity, the framework handles everything seamlessly.

### Next Steps

1. Choose your database based on your requirements
2. Configure your `.env` file
3. Run migrations
4. Start building your e-commerce ERP features!

### Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Aero MVC CLI Commands](./CLI_COMMANDS.md)
- [E-commerce ERP Module Guide](./ECOMMERCE_ERP.md)

---

**Last Updated**: 2024
**Version**: Aero MVC v2.0
**Maintained By**: Aero MVC Team
