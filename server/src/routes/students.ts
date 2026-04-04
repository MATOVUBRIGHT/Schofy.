import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      ORDER BY s.created_at DESC
    `);

    const students = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];

    res.json({ success: true, data: students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec(`
      SELECT s.*, c.name as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id 
      WHERE s.id = ${asSqlString(req.params.id)}
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const student = rowToObject(result[0].columns, result[0].values[0]);
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, dob, gender, classId, address, guardianName, guardianPhone, guardianEmail, medicalInfo, status } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const countResult = db.exec('SELECT COUNT(*) as count FROM students');
    const count = countResult.length > 0 ? Number(countResult[0].values[0][0]) : 0;
    const admissionNo = `ADM/${year}/${String(count + 1).padStart(4, '0')}`;

    db.run(`
      INSERT INTO students (id, admission_no, first_name, last_name, dob, gender, class_id, address, guardian_name, guardian_phone, guardian_email, medical_info, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, admissionNo, firstName, lastName, dob, gender, classId, address, guardianName, guardianPhone, guardianEmail, medicalInfo, status || 'active', now, now]);

    saveDatabase();

    const result = db.exec(`SELECT * FROM students WHERE id = ${asSqlString(id)}`);
    const student = rowToObject(result[0].columns, result[0].values[0]);
    res.json({ success: true, data: student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to create student' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, dob, gender, classId, address, guardianName, guardianPhone, guardianEmail, medicalInfo, status } = req.body;
    const now = new Date().toISOString();
    const db = getDatabase();

    db.run(`
      UPDATE students SET first_name = ?, last_name = ?, dob = ?, gender = ?, class_id = ?, address = ?, guardian_name = ?, guardian_phone = ?, guardian_email = ?, medical_info = ?, status = ?, updated_at = ?
      WHERE id = ?
    `, [firstName, lastName, dob, gender, classId, address, guardianName, guardianPhone, guardianEmail, medicalInfo, status, now, req.params.id]);

    saveDatabase();

    const result = db.exec(`SELECT * FROM students WHERE id = ${asSqlString(req.params.id)}`);
    const student = rowToObject(result[0].columns, result[0].values[0]);
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update student' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run(`DELETE FROM students WHERE id = ${asSqlString(req.params.id)}`);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete student' });
  }
});

export default router;
