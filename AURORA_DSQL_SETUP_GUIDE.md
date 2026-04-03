## Aurora DSQL Migration - Complete Step-by-Step Guide

### Prerequisites
- Aurora DSQL database already connected to your v0 project
- Environment variables set: `PGHOST`, `AWS_REGION`, `AWS_ROLE_ARN`
- Node.js and npm installed locally or ready in your project

---

## Step 1: Verify Aurora DSQL Connection

First, verify that Aurora DSQL is properly connected to your v0 project.

**In v0:**
1. Click **Settings** (top right)
2. Click **Vars** tab
3. Verify these variables exist:
   - `PGHOST` - Your Aurora DSQL cluster hostname
   - `AWS_REGION` - AWS region (e.g., `us-east-1`)
   - `AWS_ROLE_ARN` - Your AWS IAM role ARN

If any are missing, add them now.

---

## Step 2: Review the Database Schema Files

The following files contain your database schema:

**File 1: `/scripts/001-setup-schema.sql`**
- Contains all table definitions (auth_users, products, orders, etc.)
- Contains all indexes with `CREATE INDEX ASYNC`

**File 2: `/scripts/002-add-otp-table.sql`**
- Contains OTP verification table for signup

**File 3: `/scripts/setup-aurora-dsql.ts`**
- Node.js script that creates all tables automatically
- Runs all SQL statements from the schema files

---

## Step 3: Update package.json

Add a setup script to your `package.json`:

```json
{
  "scripts": {
    "setup:aurora": "tsx scripts/setup-aurora-dsql.ts",
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

---

## Step 4: Install Dependencies

Make sure all Aurora DSQL dependencies are installed:

```bash
npm install pg @aws-sdk/dsql-signer @vercel/functions nanoid
```

These are required for Aurora DSQL to work.

---

## Step 5: Run the Setup Script

Execute the setup script to create all tables:

**Option A: Run locally**
```bash
npm run setup:aurora
```

**Option B: Run in v0 terminal**
```bash
npx tsx scripts/setup-aurora-dsql.ts
```

**Expected output:**
```
Creating Aurora DSQL schema...
✓ Created: CREATE TABLE IF NOT EXISTS auth_users...
✓ Created: CREATE TABLE IF NOT EXISTS products...
✓ Created: CREATE TABLE IF NOT EXISTS orders...
✓ Created: CREATE TABLE IF NOT EXISTS order_items...
✓ Created: CREATE TABLE IF NOT EXISTS conversations...
✓ Created: CREATE TABLE IF NOT EXISTS messages...
✓ Created: CREATE TABLE IF NOT EXISTS payment_methods...
✓ Created: CREATE TABLE IF NOT EXISTS otp_verification...
✓ Created: CREATE INDEX ASYNC IF NOT EXISTS idx_products_merchant...
... (more indexes)
✓ Schema setup complete!
```

If you see errors, they're likely "table already exists" which is fine.

---

## Step 6: Update Component Imports

Replace all Supabase action imports with Aurora DSQL versions:

**Before (Supabase):**
```typescript
import { signup } from '@/lib/auth-actions'
import { getUserProfile } from '@/lib/user-actions'
import { getProducts } from '@/lib/product-actions'
```

**After (Aurora DSQL):**
```typescript
import { signup } from '@/lib/auth-actions-aurora'
import { getUserProfile } from '@/lib/user-actions-aurora'
import { getProducts } from '@/lib/product-actions-aurora'
```

Update these in:
- `/components/auth-form.tsx`
- `/components/profile-page.tsx`
- `/components/merchant-products.tsx`
- `/components/buyer-orders.tsx`
- `/lib/api-calls.ts` (if you have one)

---

## Step 7: Test the Connection

Create a simple test API route to verify the database is working:

**File: `/app/api/test-db/route.ts`**
```typescript
import { query } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await query('SELECT NOW() as current_time')
    return NextResponse.json({ 
      success: true, 
      data: result.rows 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
```

Test it: Open `http://localhost:3000/api/test-db` in your browser.

Expected response:
```json
{
  "success": true,
  "data": [{ "current_time": "2026-04-03T21:45:00.000Z" }]
}
```

---

## Step 8: Test User Signup

1. Go to your signup page
2. Create a new account with an email
3. You should see the OTP generation working
4. Check that the user is created in the `auth_users` table

---

## Step 9: Test Product Creation (Merchants)

1. Signup as a merchant
2. Go to merchant dashboard
3. Create a product
4. Verify it appears in your products list

---

## Step 10: Verify Data in Aurora DSQL

Connect to your Aurora DSQL database using AWS Console or CLI:

```sql
-- Check users
SELECT email, role, created_at FROM auth_users LIMIT 10;

-- Check products
SELECT name, price, merchant_id FROM products LIMIT 10;

-- Check orders
SELECT id, buyer_id, status, grand_total FROM orders LIMIT 10;
```

---

## Troubleshooting

### Error: "PGHOST not found"
**Solution:** Make sure `PGHOST`, `AWS_REGION`, and `AWS_ROLE_ARN` are set in v0 Settings > Vars

### Error: "Connection timeout"
**Solution:** Check Aurora DSQL cluster status in AWS Console. Make sure it's running.

### Error: "Table already exists"
**Solution:** This is normal. The schema file uses `CREATE TABLE IF NOT EXISTS` to safely recreate tables.

### Error: "Unknown column type"
**Solution:** Aurora DSQL doesn't support all PostgreSQL types. Use:
- `VARCHAR(length)` instead of `TEXT` for IDs
- `NUMERIC(10,2)` instead of `DECIMAL` for currency
- No `UUID` type - use `VARCHAR(100)` for IDs

### Tables not appearing in product creation
**Solution:** Run the setup script again to ensure all tables exist:
```bash
npm run setup:aurora
```

---

## File Structure Summary

```
/vercel/share/v0-project/
├── lib/
│   ├── db.ts                         # Aurora DSQL connection pool
│   ├── auth-actions-aurora.ts        # Authentication functions
│   ├── user-actions-aurora.ts        # User profile functions
│   ├── product-actions-aurora.ts     # Product CRUD functions
│   ├── order-actions-aurora.ts       # Order management functions
│   ├── message-actions-aurora.ts     # Messaging functions
│
├── scripts/
│   ├── 001-setup-schema.sql          # Main schema definition
│   ├── 002-add-otp-table.sql         # OTP table definition
│   ├── setup-aurora-dsql.ts          # Automated setup script
│
├── app/
│   ├── api/
│   │   ├── test-db/
│   │   │   └── route.ts              # Database connection test
│   │   ├── upload/route.ts           # File upload (uses Blob)
│   │   └── file/route.ts             # File serving (uses Blob)
```

---

## What Gets Created

When you run the setup script, these 8 tables are created:

1. **auth_users** - User accounts (buyers and merchants)
2. **products** - Product catalog
3. **orders** - Purchase orders
4. **order_items** - Individual items in orders
5. **conversations** - Chat conversations between buyers/merchants
6. **messages** - Chat messages
7. **payment_methods** - Saved payment methods
8. **otp_verification** - OTP codes for signup verification

Plus 10 indexes for performance optimization.

---

## Next Steps

After setup is complete:

1. ✅ All users signup/login through Aurora DSQL
2. ✅ Merchants can create products
3. ✅ Buyers can place orders
4. ✅ Chat between buyers and merchants works
5. ✅ Payment methods are saved
6. ✅ No more Supabase schema cache issues!

The Aurora DSQL database is now fully functional for your BigCat Marketplace!
