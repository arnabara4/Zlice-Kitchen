Push Notification Tables
3 minutes ago

Review
-- ====================================================================
-- Push Notification Tables Migration
-- Creates 3 separate tables for different user types
-- ====================================================================
-- 1. Canteen Push Subscriptions
-- ====================================================================
CREATE TABLE IF NOT EXISTS canteen_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint_hash TEXT NOT NULL,
  last_notified_status TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT canteen_push_subscriptions_canteen_id_key UNIQUE (canteen_id)
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_canteen_push_subscriptions_canteen_id 
ON canteen_push_subscriptions(canteen_id);
-- Create index on endpoint_hash for duplicate detection
CREATE INDEX IF NOT EXISTS idx_canteen_push_subscriptions_endpoint_hash 
ON canteen_push_subscriptions(endpoint_hash);
-- 2. Delivery Personnel Push Subscriptions
-- ====================================================================
CREATE TABLE IF NOT EXISTS delivery_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_man_id UUID NOT NULL REFERENCES delivery_man(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint_hash TEXT NOT NULL,
  last_notified_status TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT delivery_push_subscriptions_delivery_man_id_key UNIQUE (delivery_man_id)
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_push_subscriptions_delivery_man_id 
ON delivery_push_subscriptions(delivery_man_id);
-- Create index on endpoint_hash for duplicate detection
CREATE INDEX IF NOT EXISTS idx_delivery_push_subscriptions_endpoint_hash 
ON delivery_push_subscriptions(endpoint_hash);
-- 3. Super Admin Push Subscriptions
-- ====================================================================
CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_identifier TEXT NOT NULL, -- Use email or session ID since no admin table exists
  subscription JSONB NOT NULL,
  endpoint_hash TEXT NOT NULL,
  last_notified_status TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT admin_push_subscriptions_admin_identifier_key UNIQUE (admin_identifier)
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_push_subscriptions_admin_identifier 
ON admin_push_subscriptions(admin_identifier);
-- Create index on endpoint_hash for duplicate detection
CREATE INDEX IF NOT EXISTS idx_admin_push_subscriptions_endpoint_hash 
ON admin_push_subscriptions(endpoint_hash);
