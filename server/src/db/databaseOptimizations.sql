// server/src/db/databaseOptimizations.sql
-- SQLite Optimizations for Schofy
-- Run these SQL statements to optimize database performance

-- =====================================================
-- CREATE INDEXES FOR FREQUENTLY QUERIED FIELDS
-- =====================================================

-- Student indexes
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_entity_id ON attendance(entity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_entity_type_date ON attendance(entity_type, date);

-- Fee/Finance indexes
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_class_id ON fees(class_id);
CREATE INDEX IF NOT EXISTS idx_fees_term_year ON fees(term, year);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- Class/Subject indexes
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);

-- Exam/Result indexes
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);

-- Announcement indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);

-- Timetable indexes
CREATE INDEX IF NOT EXISTS idx_timetable_class_id ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day_period ON timetable(day_of_week, period);

-- Transport indexes
CREATE INDEX IF NOT EXISTS idx_transport_assignments_student_id ON transport_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_route_id ON transport_assignments(route_id);

-- Sync tracking indexes
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(timestamp);

-- =====================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================

-- Common attendance queries: entity + date
CREATE INDEX IF NOT EXISTS idx_attendance_entity_date ON attendance(entity_id, date);

-- Common finance queries: student + term + year
CREATE INDEX IF NOT EXISTS idx_fees_student_term_year ON fees(student_id, term, year);

-- Common queries: class + status
CREATE INDEX IF NOT EXISTS idx_students_class_status ON students(class_id, status);

-- =====================================================
-- ENABLE AUTOINCREMENT FOR SYNC QUEUE
-- =====================================================

-- Analyze table for query optimizer
ANALYZE;

-- =====================================================
-- PERFORMANCE TUNING PRAGMAS
-- =====================================================

-- Increase page cache for better performance
PRAGMA page_size = 4096;
PRAGMA cache_size = 2000;

-- Use Write-Ahead Logging for concurrent access
PRAGMA journal_mode = WAL;

-- Synchronous mode for faster writes (less safe but faster)
-- Use NORMAL for balance between safety and speed
PRAGMA synchronous = NORMAL;

-- Temporary files in memory for speed
PRAGMA temp_store = MEMORY;

-- Enable query planner to optimize
PRAGMA optimize;

-- =====================================================
-- ARCHIVING OLD DATA (Optional - run monthly)
-- =====================================================

-- Archive old attendance records (older than 1 year)
-- INSERT INTO attendance_archive 
-- SELECT * FROM attendance WHERE date < date('now', '-1 year');
-- DELETE FROM attendance WHERE date < date('now', '-1 year');

-- Archive old payments (older than 2 years)
-- INSERT INTO payments_archive
-- SELECT * FROM payments WHERE date < date('now', '-2 years');
-- DELETE FROM payments WHERE date < date('now', '-2 years');

-- Vacuum to reclaim space after deletion
-- VACUUM;
