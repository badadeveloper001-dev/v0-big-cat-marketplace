#!/usr/bin/env node
import { query } from '@/lib/db'

async function setupSchema() {
  try {
    console.log('Creating Aurora DSQL schema...')

    const sqlStatements = [
      // auth_users
      `CREATE TABLE IF NOT EXISTS auth_users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'buyer',
        full_name VARCHAR(255),
        address TEXT,
        avatar_url TEXT,
        email_notifications BOOLEAN DEFAULT true,
        push_notifications BOOLEAN DEFAULT true,
        sms_notifications BOOLEAN DEFAULT false,
        deleted_at TIMESTAMP,
        business_name VARCHAR(255),
        business_description TEXT,
        business_category VARCHAR(100),
        smedan_id VARCHAR(100),
        setup_completed BOOLEAN DEFAULT false,
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )`,

      // products
      `CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        merchant_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        category VARCHAR(100),
        image_url TEXT,
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )`,

      // orders
      `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        buyer_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        status VARCHAR(50) DEFAULT 'pending',
        grand_total NUMERIC(10,2),
        product_total NUMERIC(10,2),
        delivery_fee NUMERIC(10,2),
        delivery_type VARCHAR(50) DEFAULT 'normal',
        delivery_address TEXT,
        payment_method VARCHAR(100),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )`,

      // order_items
      `CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL REFERENCES orders(id),
        product_id VARCHAR(100) NOT NULL,
        merchant_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price NUMERIC(10,2) NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        weight NUMERIC(10,2) DEFAULT 0.5,
        created_at TIMESTAMP DEFAULT now()
      )`,

      // conversations
      `CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(100) PRIMARY KEY,
        buyer_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        merchant_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        last_message_at TIMESTAMP DEFAULT now(),
        created_at TIMESTAMP DEFAULT now()
      )`,

      // messages
      `CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(100) PRIMARY KEY,
        conversation_id VARCHAR(100) NOT NULL REFERENCES conversations(id),
        sender_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        content TEXT NOT NULL,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      )`,

      // payment_methods
      `CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL REFERENCES auth_users(id),
        card_type VARCHAR(50) NOT NULL,
        card_last_four VARCHAR(4) NOT NULL,
        card_holder_name VARCHAR(255) NOT NULL,
        expiry_month INTEGER NOT NULL,
        expiry_year INTEGER NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )`,

      // otp_verification
      `CREATE TABLE IF NOT EXISTS otp_verification (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts INTEGER DEFAULT 0,
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      )`,

      // Create indexes
      'CREATE INDEX ASYNC IF NOT EXISTS idx_products_merchant ON products(merchant_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_products_category ON products(category)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_orders_buyer ON orders(buyer_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_order_items_merchant ON order_items(merchant_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_conversations_merchant ON conversations(merchant_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_messages_sender ON messages(sender_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id)',
      'CREATE INDEX ASYNC IF NOT EXISTS idx_otp_email ON otp_verification(email)',
    ]

    for (const sql of sqlStatements) {
      try {
        await query(sql)
        console.log(`✓ Created: ${sql.substring(0, 50)}...`)
      } catch (error: any) {
        // Table might already exist, which is fine
        if (!error.message?.includes('already exists')) {
          console.error(`✗ Error: ${sql.substring(0, 50)}...`, error.message)
        }
      }
    }

    console.log('✓ Schema setup complete!')
    process.exit(0)
  } catch (error) {
    console.error('✗ Schema setup failed:', error)
    process.exit(1)
  }
}

setupSchema()
