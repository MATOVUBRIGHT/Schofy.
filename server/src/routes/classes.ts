import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM classes ORDER BY level, name');
    const classes = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch classes' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { name, level, stream, capacity } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO classes (id, name, level, stream, capacity, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, level, stream, capacity || 40, now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM classes WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create class' });
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, level, stream, capacity } = req.body;
    const db = getDatabase();
    db.run('UPDATE classes SET name = ?, level = ?, stream = ?, capacity = ? WHERE id = ?',
      [name, level, stream, capacity, req.params.id]);
    saveDatabase();
    const result = db.exec(`SELECT * FROM classes WHERE id = ${asSqlString(req.params.id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update class' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run(`DELETE FROM classes WHERE id = ${asSqlString(req.params.id)}`);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete class' });
  }
});

export default router;
