import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/init.js';
import { asSqlString, getStringParam, isIsoDateString, rowToObject } from '../utils/sql.js';

const router = Router();

router.post('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const data = req.body;
    console.log(`Sync create: ${table}`, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

router.put('/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    const data = req.body;
    console.log(`Sync update: ${table}`, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

router.delete('/:table/:id', async (req: Request, res: Response) => {
  try {
    const { table, id } = req.params;
    console.log(`Sync delete: ${table}/${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

router.get('/changes', async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const changes: Record<string, any[]> = {};
    const tables = ['students', 'staff', 'classes', 'subjects', 'fees', 'payments', 'attendance', 'announcements'];
    const since = getStringParam(req.query.since);
    const safeSince = since && isIsoDateString(since) ? since : '1970-01-01T00:00:00.000Z';

    for (const table of tables) {
      const result = db.exec(`SELECT * FROM ${table} WHERE updated_at > ${asSqlString(safeSince)}`);
      changes[table] = result.length > 0
        ? result[0].values.map(row => rowToObject(result[0].columns, row))
        : [];
    }

    res.json({ success: true, data: changes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch changes' });
  }
});

export default router;
