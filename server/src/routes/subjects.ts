import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM subjects ORDER BY name');
    const subjects = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subjects' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, code, classId, teacherId } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO subjects (id, name, code, class_id, teacher_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, code, classId, teacherId, now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM subjects WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create subject' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run(`DELETE FROM subjects WHERE id = ${asSqlString(req.params.id)}`);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete subject' });
  }
});

export default router;
