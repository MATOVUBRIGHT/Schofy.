-- =====================================================
-- Migration: 004_classes
-- Description: Create classes table
-- =====================================================

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1,
  stream VARCHAR(50),
  capacity INTEGER DEFAULT 40,
  class_teacher_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);

ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Add foreign key for students (class_id references classes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_students_class'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT fk_students_class 
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
  END IF;
END $$;
