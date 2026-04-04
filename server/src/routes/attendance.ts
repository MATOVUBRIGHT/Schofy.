import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, getStringParam, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const date = getStringParam(req.query.date);
    let query = 'SELECT * FROM attendance';
    if (date) query += ` WHERE date = ${asSqlString(date)}`;

    const result = db.exec(query);
    const attendance = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

router.post('/students', (req: Request, res: Response) => {
  try {
    const { date, records } = req.body;
    const db = getDatabase();
    const now = new Date().toISOString();

    for (const record of records) {
      db.run(`DELETE FROM attendance WHERE entity_type = 'student' AND entity_id = ${asSqlString(record.entityId)} AND date = ${asSqlString(date)}`);
      db.run('INSERT INTO attendance (id, entity_type, entity_id, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'student', record.entityId, date, record.status, now]);
    }

    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save attendance' });
  }
});

router.post('/staff', (req: Request, res: Response) => {
  try {
    const { date, records } = req.body;
    const db = getDatabase();
    const now = new Date().toISOString();

    for (const record of records) {
      db.run(`DELETE FROM attendance WHERE entity_type = 'staff' AND entity_id = ${asSqlString(record.entityId)} AND date = ${asSqlString(date)}`);
      db.run('INSERT INTO attendance (id, entity_type, entity_id, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), 'staff', record.entityId, date, record.status, now]);
    }

    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save attendance' });
  }
});

export default router;
