-- =====================================================
-- Migration: 014_sync_logs
-- Description: Create sync_logs table for tracking sync operations
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  direction VARCHAR(10) NOT NULL,
  operation VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  local_data JSONB,
  remote_data JSONB,
  resolved_with VARCHAR(20),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_school_id ON sync_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);
