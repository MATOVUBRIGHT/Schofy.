-- =====================================================
-- Migration: 009_exams
-- Description: Create exams and exam_results tables
-- =====================================================

-- EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name VARCHAR(200) NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  term VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE exams DISABLE ROW LEVEL SECURITY;

-- EXAM RESULTS TABLE
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL,
  grade VARCHAR(5),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;
