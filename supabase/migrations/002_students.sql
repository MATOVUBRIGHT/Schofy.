-- =====================================================
-- Migration: 002_students
-- Description: Create students table
-- =====================================================

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id VARCHAR(100),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20) DEFAULT 'male',
  dob DATE,
  class_id UUID,
  stream VARCHAR(50),
  address TEXT,
  guardian_name VARCHAR(200),
  guardian_phone VARCHAR(50),
  guardian_email VARCHAR(255),
  medical_info TEXT,
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  admission_no VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

ALTER TABLE students DISABLE ROW LEVEL SECURITY;
