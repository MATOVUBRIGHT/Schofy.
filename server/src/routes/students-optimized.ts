// server/src/routes/students-optimized.ts
// Optimized student endpoints with pagination and projections

import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { asSqlString, rowToObject } from '../utils/sql.js';

const router = Router();

/**
 * GET /api/students/paginated
 * Query params: page=1, pageSize=20, sortBy=firstName, sortOrder=asc
 * Returns only paginated results, not entire dataset
 */
router.get('/paginated', authenticateToken, (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const sortBy = (req.query.sortBy as string) || 'created_at';
    const sortOrder = (req.query.sortOrder as string) || 'DESC';

    const db = getDatabase();

    // Get total count efficiently
    const countResult = db.exec('SELECT COUNT(*) as count FROM students');
    const total = Number(countResult[0]?.values[0]?.[0]) || 0;

    // Get paginated page results
    const offset = (page - 1) * pageSize;
    const result = db.exec(
      `SELECT * FROM students ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const students = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];

    res.json({
      success: true,
      data: {
        items: students,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

/**
 * GET /api/students/search
 * Query params: q=search_term, page=1, pageSize=20
 * Full-text search with pagination
 */
router.get('/search', authenticateToken, (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    if (query.length < 2) {
      return res.json({ success: true, data: { items: [], pagination: { page, pageSize, total: 0, totalPages: 0 } } });
    }

    const db = getDatabase();
    const searchTerm = `%${query}%`;

    // Count matching results
    const countResult = db.exec(
      `SELECT COUNT(*) as count FROM students 
       WHERE first_name LIKE ? OR last_name LIKE ? OR admission_no LIKE ?`,
      [searchTerm, searchTerm, searchTerm]
    );
    const total = Number(countResult[0]?.values[0]?.[0]) || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const result = db.exec(
      `SELECT * FROM students 
       WHERE first_name LIKE ? OR last_name LIKE ? OR admission_no LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, pageSize, offset]
    );

    const students = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];

    res.json({
      success: true,
      data: {
        items: students,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        query,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

/**
 * POST /api/students/batch-create
 * Create multiple students in one transaction
 * Much faster than individual creates
 */
router.post('/batch-create', authenticateToken, (req: Request, res: Response) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Records array required' });
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    let created = 0;
    let failed = 0;

    // Wrap in transaction for atomicity
    db.run('BEGIN TRANSACTION');

    try {
      for (const record of records) {
        try {
          db.run(
            `INSERT INTO students (id, admission_no, first_name, last_name, gender, class_id, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [record.id, record.admissionNo, record.firstName, record.lastName, record.gender, record.classId, 'active', now, now]
          );
          created++;
        } catch (e) {
          failed++;
        }
      }

      db.run('COMMIT');
      saveDatabase();

      res.json({
        success: true,
        data: { created, failed, total: records.length },
      });
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Batch create failed' });
  }
});

/**
 * PUT /api/students/batch-update
 * Update multiple students efficiently
 */
router.put('/batch-update', authenticateToken, (req: Request, res: Response) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Records array required' });
    }

    const db = getDatabase();
    const now = new Date().toISOString();
    let updated = 0;
    let failed = 0;

    db.run('BEGIN TRANSACTION');

    try {
      for (const record of records) {
        try {
          db.run(
            `UPDATE students SET first_name = ?, last_name = ?, class_id = ?, status = ?, updated_at = ?
             WHERE id = ?`,
            [record.firstName, record.lastName, record.classId, record.status || 'active', now, record.id]
          );
          updated++;
        } catch (e) {
          failed++;
        }
      }

      db.run('COMMIT');
      saveDatabase();

      res.json({
        success: true,
        data: { updated, failed, total: records.length },
      });
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Batch update failed' });
  }
});

/**
 * POST /api/students/batch-delete
 * Delete multiple students efficiently
 */
router.post('/batch-delete', authenticateToken, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'IDs array required' });
    }

    const db = getDatabase();
    let deleted = 0;

    db.run('BEGIN TRANSACTION');

    try {
      for (const id of ids) {
        try {
          db.run('DELETE FROM students WHERE id = ?', [id]);
          deleted++;
        } catch (e) {
          // Continue with next
        }
      }

      db.run('COMMIT');
      saveDatabase();

      res.json({
        success: true,
        data: { deleted, total: ids.length },
      });
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Batch delete failed' });
  }
});

/**
 * GET /api/students/by-class/:classId
 * Get students for a class (with index)
 */
router.get('/by-class/:classId', authenticateToken, (req: Request, res: Response) => {
  try {
    const classId = req.params.classId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));

    const db = getDatabase();

    // Use index on class_id
    const countResult = db.exec(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [classId]
    );
    const total = Number(countResult[0]?.values[0]?.[0]) || 0;

    const offset = (page - 1) * pageSize;
    const result = db.exec(
      'SELECT * FROM students WHERE class_id = ? ORDER BY first_name ASC LIMIT ? OFFSET ?',
      [classId, pageSize, offset]
    );

    const students = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];

    res.json({
      success: true,
      data: {
        items: students,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch class students' });
  }
});

export default router;
