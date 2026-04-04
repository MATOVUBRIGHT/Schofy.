-- =====================================================
-- Migration: 006_attendance
-- Description: Create attendance table
-- =====================================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  entity_type VARCHAR(20) NOT NULL,
  entity_id UUID NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  remarks TEXT,
  marked_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_entity ON attendance(entity_type, entity_id);

ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
