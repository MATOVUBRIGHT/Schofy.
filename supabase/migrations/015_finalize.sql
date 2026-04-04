-- =====================================================
-- Migration: 015_finalize
-- Description: Create updated_at trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT t.tablename FROM pg_tables t
    WHERE t.schemaname = 'public' 
    AND EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public' 
      AND c.table_name = t.tablename
      AND c.column_name = 'updated_at'
    )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', rec.tablename, rec.tablename);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      rec.tablename, rec.tablename
    );
  END LOOP;
END $$;

-- Final verification
SELECT 'All migrations completed successfully!' AS status;
