## Aurora DSQL Migration - Quick Checklist

### Pre-Migration Checklist
- [ ] Aurora DSQL is connected to v0 project
- [ ] Environment variables set: PGHOST, AWS_REGION, AWS_ROLE_ARN
- [ ] npm/node available in terminal

### Migration Steps
- [ ] **Step 1:** Verify Aurora DSQL connection in v0 Settings > Vars
- [ ] **Step 2:** Review schema files (001-setup-schema.sql, 002-add-otp-table.sql)
- [ ] **Step 3:** Update package.json with setup script
- [ ] **Step 4:** Run `npm install pg @aws-sdk/dsql-signer @vercel/functions nanoid`
- [ ] **Step 5:** Run `npm run setup:aurora` to create all tables
- [ ] **Step 6:** Update component imports (Supabase → Aurora DSQL)
  - [ ] Update auth-actions imports
  - [ ] Update user-actions imports
  - [ ] Update product-actions imports
  - [ ] Update order-actions imports
  - [ ] Update message-actions imports
- [ ] **Step 7:** Test database connection with /api/test-db route
- [ ] **Step 8:** Test user signup
- [ ] **Step 9:** Test merchant product creation
- [ ] **Step 10:** Verify data in Aurora DSQL with SQL queries

### Files to Replace in Components

Find and replace these imports in your components:

**Old (Supabase):**
```
import { ... } from '@/lib/auth-actions'
import { ... } from '@/lib/user-actions'
import { ... } from '@/lib/product-actions'
import { ... } from '@/lib/order-actions'
import { ... } from '@/lib/message-actions'
```

**New (Aurora DSQL):**
```
import { ... } from '@/lib/auth-actions-aurora'
import { ... } from '@/lib/user-actions-aurora'
import { ... } from '@/lib/product-actions-aurora'
import { ... } from '@/lib/order-actions-aurora'
import { ... } from '@/lib/message-actions-aurora'
```

### Post-Migration Verification
- [ ] Signup/login works
- [ ] Merchant can create products
- [ ] Buyer can view products
- [ ] Orders can be created
- [ ] Checkout process works
- [ ] Chat messages appear
- [ ] No console errors

### Rollback Plan (if needed)
- [ ] Keep Supabase project running temporarily
- [ ] Revert imports back to old action files
- [ ] Test with Supabase again

### Complete! ✓
Once all items are checked, your app is fully migrated to Aurora DSQL!
