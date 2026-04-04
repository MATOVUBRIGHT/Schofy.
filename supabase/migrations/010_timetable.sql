-- =====================================================
-- Migration: 010_timetable
-- Description: Create timetable table
-- =====================================================

CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID,
  day_of_week INTEGER DEFAULT 0,
  period INTEGER DEFAULT 1,
  start_time TIME,
  end_time TIME,
  room VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE timetable DISABLE ROW LEVEL SECURITY;
