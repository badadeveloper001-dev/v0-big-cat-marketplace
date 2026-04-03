## Component Import Changes - Find & Replace Guide

### 1. Auth Form Components
**File:** `/components/auth-form.tsx` or `/components/otp-verification.tsx`

```diff
- import { signup } from '@/lib/auth-actions'
- import { login } from '@/lib/auth-actions'
- import { generateOTP } from '@/lib/auth-actions'
- import { verifyOTP } from '@/lib/auth-actions'

+ import { signup } from '@/lib/auth-actions-aurora'
+ import { login } from '@/lib/auth-actions-aurora'
+ import { generateOTP } from '@/lib/auth-actions-aurora'
+ import { verifyOTP } from '@/lib/auth-actions-aurora'
```

---

### 2. Profile & Settings Pages
**File:** `/components/profile-page.tsx`, `/components/settings-page.tsx`, `/components/merchant-profile-page.tsx`

```diff
- import { getUserProfile } from '@/lib/user-actions'
- import { updateUserProfile } from '@/lib/user-actions'
- import { deleteUserAccount } from '@/lib/user-actions'

+ import { getUserProfile } from '@/lib/user-actions-aurora'
+ import { updateUserProfile } from '@/lib/user-actions-aurora'
+ import { deleteUserAccount } from '@/lib/user-actions-aurora'
```

---

### 3. Product Pages
**File:** `/components/merchant-products.tsx`, `/components/buyer-products.tsx`

```diff
- import { getProducts } from '@/lib/product-actions'
- import { createProduct } from '@/lib/product-actions'
- import { updateProduct } from '@/lib/product-actions'
- import { deleteProduct } from '@/lib/product-actions'

+ import { getProducts } from '@/lib/product-actions-aurora'
+ import { createProduct } from '@/lib/product-actions-aurora'
+ import { updateProduct } from '@/lib/product-actions-aurora'
+ import { deleteProduct } from '@/lib/product-actions-aurora'
```

---

### 4. Order Pages
**File:** `/components/buyer-orders.tsx`, `/components/merchant-orders.tsx`

```diff
- import { getBuyerOrders } from '@/lib/order-actions'
- import { getMerchantOrders } from '@/lib/order-actions'
- import { createOrder } from '@/lib/order-actions'
- import { updateOrderStatus } from '@/lib/order-actions'

+ import { getBuyerOrders } from '@/lib/order-actions-aurora'
+ import { getMerchantOrders } from '@/lib/order-actions-aurora'
+ import { createOrder } from '@/lib/order-actions-aurora'
+ import { updateOrderStatus } from '@/lib/order-actions-aurora'
```

---

### 5. Chat/Messaging Pages
**File:** `/components/chat-page.tsx`, `/components/messages-panel.tsx`

```diff
- import { getConversations } from '@/lib/message-actions'
- import { sendMessage } from '@/lib/message-actions'
- import { getMessages } from '@/lib/message-actions'

+ import { getConversations } from '@/lib/message-actions-aurora'
+ import { sendMessage } from '@/lib/message-actions-aurora'
+ import { getMessages } from '@/lib/message-actions-aurora'
```

---

### 6. Dashboard & Layout Files
**File:** `/app/page.tsx`, `/app/dashboard/page.tsx`

If you have any imports from action files, update them:

```diff
- import { getCurrentUser } from '@/lib/auth-actions'
- import { getLatestProducts } from '@/lib/product-actions'

+ import { getCurrentUser } from '@/lib/auth-actions-aurora'
+ import { getLatestProducts } from '@/lib/product-actions-aurora'
```

---

## How to Find All Imports to Change

### Using VS Code Find & Replace

1. **Open Find & Replace:** `Ctrl+H` (Windows) or `Cmd+Shift+H` (Mac)

2. **Replace auth-actions:**
   - Find: `from '@/lib/auth-actions'`
   - Replace: `from '@/lib/auth-actions-aurora'`
   - Click "Replace All"

3. **Replace user-actions:**
   - Find: `from '@/lib/user-actions'`
   - Replace: `from '@/lib/user-actions-aurora'`
   - Click "Replace All"

4. **Replace product-actions:**
   - Find: `from '@/lib/product-actions'`
   - Replace: `from '@/lib/product-actions-aurora'`
   - Click "Replace All"

5. **Replace order-actions:**
   - Find: `from '@/lib/order-actions'`
   - Replace: `from '@/lib/order-actions-aurora'`
   - Click "Replace All"

6. **Replace message-actions:**
   - Find: `from '@/lib/message-actions'`
   - Replace: `from '@/lib/message-actions-aurora'`
   - Click "Replace All"

7. **Replace merchant-setup-actions:**
   - Find: `from '@/lib/merchant-setup-actions'`
   - Replace: `from '@/lib/merchant-setup-actions-aurora'` (if you have this)
   - Click "Replace All"

---

## Verify All Changes

After replacing all imports, search for remaining Supabase imports:

1. Find: `from '@/lib/supabase`
2. These should all be removed or replaced with Aurora DSQL equivalents

---

## Testing After Import Changes

Once all imports are updated:

1. **Start dev server:** `npm run dev`
2. **Check console for errors** - should see no import errors
3. **Test signup** - create a new account
4. **Test login** - login with the account
5. **Test products** - create/view products (if merchant)
6. **Test orders** - create/view orders (if buyer)
7. **Test profile** - update user profile

---

## Common Issues After Import Changes

**Issue:** "Cannot find module '@/lib/auth-actions-aurora'"
**Solution:** Make sure the `-aurora.ts` files exist in `/lib/` folder

**Issue:** "Function 'signup' is not exported from '@/lib/auth-actions-aurora'"
**Solution:** Check that the function is exported with `export async function signup(...)`

**Issue:** "Unexpected token at top of file"
**Solution:** Make sure file starts with `'use server'` directive for server actions

---

## Quick Reference - All Aurora DSQL Files Created

| File | Location | Purpose |
|------|----------|---------|
| db.ts | `/lib/db.ts` | Database connection pool |
| auth-actions-aurora.ts | `/lib/auth-actions-aurora.ts` | Signup, login, OTP |
| user-actions-aurora.ts | `/lib/user-actions-aurora.ts` | User profiles |
| product-actions-aurora.ts | `/lib/product-actions-aurora.ts` | Products |
| order-actions-aurora.ts | `/lib/order-actions-aurora.ts` | Orders |
| message-actions-aurora.ts | `/lib/message-actions-aurora.ts` | Chat messages |
| 001-setup-schema.sql | `/scripts/001-setup-schema.sql` | Main schema |
| 002-add-otp-table.sql | `/scripts/002-add-otp-table.sql` | OTP schema |
| setup-aurora-dsql.ts | `/scripts/setup-aurora-dsql.ts` | Setup script |
