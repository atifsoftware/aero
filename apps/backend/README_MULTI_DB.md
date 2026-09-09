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

### ৩. এনভায়রনমেন্ট ভেরিয়েবল (`.env`)
```env
DB_TYPE=mysql  # or 'postgresql'
DB_HOST=127.0.0.1
DB_PORT=3306   # 5432 for PostgreSQL
DB_USER=root
DB_PASS=
DB_NAME=aero_erp_db
```

### ৪. Documentation
- `docs/MULTI_DATABASE_SUPPORT.md` - বিস্তারিত গাইড

## ব্যবহারের নিয়ম:

### MySQL ব্যবহার করতে:
```env
DB_TYPE=mysql
DB_PORT=3306
DATABASE_URL=mysql://root:@localhost:3306/aero_erp_db
```

### PostgreSQL ব্যবহার করতে:
```env
DB_TYPE=postgresql
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DATABASE_URL=postgresql://user:pass@localhost:5432/aero_erp_db
```

## বৈশিষ্ট্যসমূহ:

✅ **Automatic Database Detection** - URL বা পোর্ট দেখে অটো ডিটেক্ট করে
✅ **Identifier Escaping** - MySQL: \`table\`, PostgreSQL: "table"
✅ **Parameter Placeholders** - MySQL: ?, PostgreSQL: $1, $2, $3
✅ **Result Normalization** - উভয় ডাটাবেস থেকে একই ফরম্যাটে রেজাল্ট
✅ **Query Builder Compatible** - সব Query Builder মেথড কাজ করবে
✅ **Migration Support** - উভয় ডাটাবেসের জন্য মাইগ্রেশন

## টেস্টিং:

```bash
# ডাটাবেস কানেকশন চেক করুন
node -e "require('./config/db'); console.log('Connected!');"

# MySQL এ রান করুন
npm start

# PostgreSQL এ সুইচ করতে .env আপডেট করুন এবং রিস্টার্ট দিন
```

## পরামর্শ:

1. **ই-কমার্স ERP এর জন্য**: MySQL ভালো পারফরম্যান্স দেয়
2. **Complex Queries এর জন্য**: PostgreSQL বেশি শক্তিশালী
3. **Production এ**: যে ডাটাবেসে আপনার টিম অভ্যস্ত সেটি ব্যবহার করুন

## সীমাবদ্ধতা:

⚠️ PostgreSQL এ অটো ডাটাবেস ক্রিয়েশন কাজ করে না (ম্যানুয়ালি তৈরি করতে হবে)
⚠️ কিছু SQL সিনট্যাক্স ডাটাবেস ভেদে ভিন্ন হতে পারে

---

**Status**: ✅ Complete & Ready to Use
**Documentation**: `docs/MULTI_DATABASE_SUPPORT.md`
