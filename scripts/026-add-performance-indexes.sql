-- Performance indexes missing from earlier migrations
-- Run this in Supabase SQL Editor

-- orders(merchant_id) — used in getMerchantOrders, bulk revenue aggregation in cron jobs
-- Earlier scripts only indexed order_items(merchant_id), not orders(merchant_id)
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);

-- Composite index for cron bulk revenue query:
-- .in("merchant_id", ids).in("status", settled).gte("created_at", from).lt("created_at", to)
CREATE INDEX IF NOT EXISTS idx_orders_merchant_status_created
  ON orders(merchant_id, status, created_at DESC);

-- products(is_active) — primary filter on every marketplace load
-- Earlier scripts have products(category) and products(status) but not is_active
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Composite for filtered marketplace queries:
-- .eq('is_active', true).eq('category', ...).order('created_at')
CREATE INDEX IF NOT EXISTS idx_products_active_category_created
  ON products(is_active, category, created_at DESC);

-- weekly_business_report_logs — used in deduplication check per cron run
CREATE INDEX IF NOT EXISTS idx_weekly_report_logs_merchant_week
  ON weekly_business_report_logs(merchant_id, week_start);

-- auth_users(role) already exists in create-auth-schema.sql — no duplicate needed
-- orders(buyer_id), orders(status) already exist in 001/005 — no duplicate needed
-- products(category), products(merchant_id) already exist in 004 — no duplicate needed
