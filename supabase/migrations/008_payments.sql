-- =====================================================
-- Migration: 008_payments
-- Description: Create payments, salary_payments, invoices tables
-- =====================================================

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  fee_id UUID REFERENCES fees(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  method VARCHAR(50) DEFAULT 'cash',
  reference VARCHAR(100),
  date DATE NOT NULL,
  recorded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_school_id ON payments(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);

ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- SALARY PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  staff_name VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  month VARCHAR(7) NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE salary_payments DISABLE ROW LEVEL SECURITY;

-- INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  term VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  due_date DATE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoices_school_id ON invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);

ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
