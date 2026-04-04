import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/structure', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM fees ORDER BY created_at DESC');
    const fees = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fees' });
  }
});

router.post('/structure', (req: Request, res: Response) => {
  try {
    const { description, amount, term, year, classId } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO fees (id, description, amount, term, year, class_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, description, amount, term, year, classId, now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM fees WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create fee' });
  }
});

router.get('/invoices', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT f.*, s.first_name || ' ' || s.last_name as student_name, s.admission_no
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      ORDER BY f.created_at DESC
    `);
    const invoices = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

router.post('/invoices', (req: Request, res: Response) => {
  try {
    const { studentId, description, amount, term, year } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO fees (id, student_id, description, amount, term, year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, studentId, description, amount, term, year, now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM fees WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

router.get('/payments', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT p.*, s.first_name || ' ' || s.last_name as student_name
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      ORDER BY p.date DESC
    `);
    const payments = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

router.post('/payments', (req: Request, res: Response) => {
  try {
    const { feeId, studentId, amount, method, reference } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO payments (id, fee_id, student_id, amount, method, reference, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, feeId, studentId, amount, method, reference, now, now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM payments WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  }
});

router.get('/reports/collection', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const totalResult = db.exec('SELECT SUM(amount) as total FROM payments');
    const total = totalResult.length > 0 ? totalResult[0].values[0][0] || 0 : 0;
    const countResult = db.exec('SELECT COUNT(*) as count FROM payments');
    const count = countResult.length > 0 ? countResult[0].values[0][0] : 0;
    res.json({ success: true, data: { total, count } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

export default router;
