import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';
import { asSqlString, getStringParam, rowToObject } from '../utils/sql.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/routes', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const result = db.exec('SELECT * FROM transport_routes ORDER BY name');
    const routes = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch routes' });
  }
});

router.post('/routes', (req: Request, res: Response) => {
  try {
    const { name, description, fee } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO transport_routes (id, name, description, fee, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, description, fee || 0, now]);
    saveDatabase();

    const result = db.exec(`SELECT * FROM transport_routes WHERE id = ${asSqlString(id)}`);
    res.json({ success: true, data: rowToObject(result[0].columns, result[0].values[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create route' });
  }
});

router.delete('/routes/:id', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.run(`DELETE FROM transport_routes WHERE id = ${asSqlString(req.params.id)}`);
    db.run(`DELETE FROM transport_assignments WHERE route_id = ${asSqlString(req.params.id)}`);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete route' });
  }
});

router.get('/assignments', (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const routeId = getStringParam(req.query.routeId);
    let query = 'SELECT ta.*, s.first_name, s.last_name FROM transport_assignments ta LEFT JOIN students s ON ta.student_id = s.id';
    if (routeId) query += ` WHERE ta.route_id = ${asSqlString(routeId)}`;

    const result = db.exec(query);
    const assignments = result.length > 0
      ? result[0].values.map(row => rowToObject(result[0].columns, row))
      : [];
    res.json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

router.post('/assignments', (req: Request, res: Response) => {
  try {
    const { studentId, routeId, pickupTime, dropTime } = req.body;
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run('INSERT INTO transport_assignments (id, student_id, route_id, pickup_time, drop_time, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, studentId, routeId, pickupTime, dropTime, now]);
    saveDatabase();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create assignment' });
  }
});

export default router;
