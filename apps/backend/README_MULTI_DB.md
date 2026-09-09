# ✅ Multi-Database Support Added to Aero MVC

## সারসংক্ষেপ (Summary)

Aero MVC ফ্রেমওয়ার্কে এখন **MySQL** এবং **PostgreSQL** উভয় ডাটাবেস সাপোর্ট যুক্ত করা হয়েছে। আপনি সহজেই এক ডাটাবেস থেকে অন্য ডাটাবেসে সুইচ করতে পারবেন।

## কী কী পরিবর্তন করা হয়েছে:

### ১. ইনস্টলেশন
```bash
npm install pg  # PostgreSQL driver installed
```

### ২. কনফিগারেশন ফাইল আপডেট (`config/db.js`)
- Auto-detection of database type (MySQL/PostgreSQL)
- Identifier escaping (backticks for MySQL, double quotes for PostgreSQL)
- Parameter placeholder conversion (? for MySQL, $1/$2 for PostgreSQL)
- Result normalization for both databases
- Connection pool management for both database types

### ৩. এনভায়রনমেন্ট ভেরিয়েবল (`.env`)
```env
DB_TYPE=mysql  # or 'postgresql'
DB_HOST=127.0.0.1
DB_PORT=3306   # 5432 for PostgreSQL
DB_USER=root
DB_PASS=your_password
DB_NAME=aero_erp_db
```

### ৪. Documentation
- `docs/MULTI_DATABASE_SUPPORT.md` - বিস্তারিত ইংরেজি গাইড
- এই ফাইল - বাংলায় সংক্ষিপ্ত গাইড

## ব্যবহারের নিয়ম:

### MySQL ব্যবহার করতে:
```env
DB_TYPE=mysql
DB_PORT=3306
DATABASE_URL=mysql://root:password@localhost:3306/aero_erp_db
```

### PostgreSQL ব্যবহার করতে:
```env
DB_TYPE=postgresql
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DATABASE_URL=postgresql://postgres:password@localhost:5432/aero_erp_db
```

## বৈশিষ্ট্যসমূহ:

✅ **Automatic Database Detection** - URL বা পোর্ট দেখে অটো ডিটেক্ট করে
✅ **Identifier Escaping** - MySQL: \`table\`, PostgreSQL: "table"
✅ **Parameter Placeholders** - MySQL: ?, PostgreSQL: $1, $2, $3
✅ **Result Normalization** - উভয় ডাটাবেস থেকে একই ফরম্যাটে রেজাল্ট
✅ **Query Builder Compatible** - সব Query Builder মেথড কাজ করবে
✅ **Migration Support** - উভয় ডাটাবেসের জন্য মাইগ্রেশন
✅ **Transaction Support** - উভয় ডাটাবেসে ট্রানজেকশন সাপোর্ট
✅ **Connection Pooling** - অটোমেটিক কানেকশন পুল ম্যানেজমেন্ট

## কোড উদাহরণ:

```javascript
const db = require('./config/db');

// উভয় ডাটাবেসে একই কোড কাজ করবে
const users = await db.table('users')
  .select('id', 'name')
  .where('active', 1)
  .get();

// Insert - উভয় ডাটাবেসে কাজ করবে
const id = await db.table('products').insert({
  name: 'Product Name',
  price: 100
});

// Transaction - উভয় ডাটাবেসে কাজ করবে
await db.transaction(async (trx) => {
  const orderId = await trx.table('orders').insert({
    customer_id: 1,
    total: 100
  });
  
  await trx.table('order_items').insert({
    order_id: orderId,
    product_id: 5,
    quantity: 2
  });
});
```

## টেস্টিং:

```bash
# ডাটাবেস কানেকশন চেক করুন
node -e "require('./config/db').then(() => console.log('✅ Connected!')).catch(console.error);"

# MySQL এ রান করুন
npm start

# PostgreSQL এ সুইচ করতে .env আপডেট করুন এবং রিস্টার্ট দিন
```

## ই-কমার্স ERP এর জন্য পরামর্শ:

### MySQL ব্যবহার করুন যদি:
- ✅ Simple product catalog
- ✅ High read traffic
- ✅ Standard e-commerce operations
- ✅ আপনার টিম MySQL এ অভ্যস্ত

### PostgreSQL ব্যবহার করুন যদি:
- ✅ Complex inventory management
- ✅ Advanced reporting and analytics
- ✅ JSON data storage (product attributes)
- ✅ Advanced data types (arrays, UUID) দরকার
- ✅ Complex transactions and constraints

## সীমাবদ্ধতা:

⚠️ PostgreSQL এ অটো ডাটাবেস ক্রিয়েশন কাজ করে না (ম্যানুয়ালি তৈরি করতে হবে)
```sql
CREATE DATABASE aero_erp_db;
```

⚠️ কিছু SQL সিনট্যাক্স ডাটাবেস ভেদে ভিন্ন হতে পারে (advanced features এর জন্য raw query ব্যবহার করুন)

## ডাটাবেস সুইচ করার নিয়ম:

1. অ্যাপ্লিকেশন বন্ধ করুন
2. `.env` ফাইলে DB_TYPE পরিবর্তন করুন
3. নতুন ডাটাবেস তৈরি করুন (যদি না থাকে)
4. মাইগ্রেশন রান করুন: `node aero migrate`
5. অ্যাপ্লিকেশন চালু করুন: `npm start`

## সমস্যা সমাধান:

### "Connection refused" Error
- ডাটাবেস সার্ভার চলছে কিনা চেক করুন
- `.env` এ host এবং port ভেরিফাই করুন
- Firewall সেটিংস চেক করুন

### "Database does not exist" (PostgreSQL)
```sql
psql -U postgres
CREATE DATABASE aero_erp_db;
GRANT ALL PRIVILEGES ON DATABASE aero_erp_db TO postgres;
```

### "Authentication failed" Error
- `.env` এ username এবং password ভেরিফাই করুন
- ডাটাবেস ইউজার পারমিশন চেক করুন
- PostgreSQL এর জন্য `pg_hba.conf` চেক করুন

---

**Status**: ✅ Complete & Ready to Use
**Documentation**: `docs/MULTI_DATABASE_SUPPORT.md` (বিস্তারিত ইংরেজি গাইড)
**Version**: Aero MVC v2.0
**Last Updated**: 2024
