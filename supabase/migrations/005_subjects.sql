-- =====================================================
-- Migration: 005_subjects
-- Description: Create subjects table
-- =====================================================

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);

ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
