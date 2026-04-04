-- =====================================================
-- Migration: 007_fees
-- Description: Create fees, fee_structures, bursaries, discounts tables
-- =====================================================

-- FEES TABLE
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  due_date DATE NOT NULL,
  term VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fees_school_id ON fees(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);

ALTER TABLE fees DISABLE ROW LEVEL SECURITY;

-- FEE STRUCTURES TABLE
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'tuition',
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  term VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_school_id ON fee_structures(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);

ALTER TABLE fee_structures DISABLE ROW LEVEL SECURITY;

-- BURSARIES TABLE
CREATE TABLE IF NOT EXISTS bursaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  term VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE bursaries DISABLE ROW LEVEL SECURITY;

-- DISCOUNTS TABLE
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  class_name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'fixed',
  amount DECIMAL(12,2) NOT NULL,
  term VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE discounts DISABLE ROW LEVEL SECURITY;
