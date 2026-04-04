import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM staff ORDER BY created_at DESC');
    const staff = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec(`SELECT * FROM staff WHERE id = ${asSqlString(req.params.id)}`);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, role, department, dob, address, phone, email, salary, status } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const countResult = db.exec('SELECT COUNT(*) as count FROM staff');
    const count = countResult.length > 0 ? Number(countResult[0].values[0][0]) : 0;
    const employeeId = `EMP/${year}/${String(count + 1).padStart(4, '0')}`;

    db.run(`
      INSERT INTO staff (id, employee_id, first_name, last_name, role, department, dob, address, phone, email, salary, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, employeeId, firstName, lastName, role, department, dob, address, phone, email, salary, status || 'active', now, now]);

    saveDatabase();
    const result = db.exec(`SELECT * FROM staff WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create staff' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, role, department, dob, address, phone, email, salary, status } = req.body;
    const now = new Date().toISOString();
    const db = getDatabase();

    db.run(`
      UPDATE staff SET first_name = ?, last_name = ?, role = ?, department = ?, dob = ?, address = ?, phone = ?, email = ?, salary = ?, status = ?, updated_at = ?
      WHERE id = ?
    `, [firstName, lastName, role, department, dob, address, phone, email, salary, status, now, req.params.id]);

    saveDatabase();
    const result = db.exec(`SELECT * FROM staff WHERE id = ${asSqlString(req.params.id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update staff' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run(`DELETE FROM staff WHERE id = ${asSqlString(req.params.id)}`);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete staff' });
  }
});

export default router;
