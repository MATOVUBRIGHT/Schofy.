import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { rowToObject } from '../utils/sql.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM settings');
    const settings: Record<string, any> = {};
    if (result.length > 0) {
      result[0].values.forEach(row => {
        const obj = rowToObject(result[0].columns, row);
        settings[obj.key] = obj.value;
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

router.put('/', (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const now = new Date().toISOString();
    const db = getDatabase();

    db.run('INSERT OR REPLACE INTO settings (id, "key", value, updated_at) VALUES (?, ?, ?, ?)',
      [key, key, JSON.stringify(value), now]);
    saveDatabase();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

export default router;
