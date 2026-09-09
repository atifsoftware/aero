# Multi-Database Support in Aero MVC

Aero MVC now supports both **MySQL** and **PostgreSQL** databases with automatic detection and seamless switching.

## Configuration

### Method 1: Using DB_TYPE Environment Variable

```env
DB_TYPE=mysql  # or 'postgresql'
DB_HOST=127.0.0.1
DB_PORT=3306   # 5432 for PostgreSQL
DB_USER=root
DB_PASS=your_password
DB_NAME=aero_erp_db
```

### Method 2: Using DATABASE_URL

**For MySQL:**
```env
DATABASE_URL=mysql://root:password@localhost:3306/aero_erp_db
```

**For PostgreSQL:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/aero_erp_db
```

### Method 3: Auto-Detection by Port
- Port 3306 → MySQL
- Port 5432 → PostgreSQL
