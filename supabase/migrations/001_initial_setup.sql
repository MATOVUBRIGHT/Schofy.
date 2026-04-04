-- =====================================================
-- Migration: 001_initial_setup
-- Description: Enable UUID extension and create schools table
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SCHOOLS TABLE (must be first - all tables reference it)
-- =====================================================
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  logo_url TEXT,
  settings JSONB DEFAULT '{"currency": "USD", "currencySymbol": "$", "dateFormat": "YYYY-MM-DD", "academicYearStart": 9, "termsPerYear": 3, "timezone": "UTC", "theme": "light", "primaryColor": "#6366f1"}',
  plan VARCHAR(50) DEFAULT 'free',
  max_students INTEGER DEFAULT 100,
  max_staff INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Insert a default school
INSERT INTO schools (id, name, settings) 
VALUES ('00000000-0000-0000-0000-000000000001', 'My School', '{"currency": "USD", "currencySymbol": "$"}')
ON CONFLICT DO NOTHING;
