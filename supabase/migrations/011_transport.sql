-- =====================================================
-- Migration: 011_transport
-- Description: Create transport_routes and transport_assignments tables
-- =====================================================

-- TRANSPORT ROUTES TABLE
CREATE TABLE IF NOT EXISTS transport_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name VARCHAR(200) NOT NULL,
  vehicle_number VARCHAR(50),
  driver_name VARCHAR(200),
  driver_phone VARCHAR(50),
  pickup_points TEXT,
  fee DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE transport_routes DISABLE ROW LEVEL SECURITY;

-- TRANSPORT ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS transport_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
  pickup_point VARCHAR(200),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE transport_assignments DISABLE ROW LEVEL SECURITY;
