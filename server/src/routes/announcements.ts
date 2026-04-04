import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM announcements ORDER BY created_at DESC');
    const announcements = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
  }
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { title, content, priority, createdBy } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO announcements (id, title, content, priority, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, content, priority || 'medium', createdBy || 'admin', now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM announcements WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create announcement' });
  }
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run(`DELETE FROM announcements WHERE id = ${asSqlString(req.params.id)}`);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete announcement' });
  }
});

export default router;
