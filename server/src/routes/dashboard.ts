import { Router, Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db/init.js';

const router = Router();

function rowToObject(columns: string[], values: any[]): any {
  const obj: any = {};
  columns.forEach((col, i) => { obj[col] = values[i]; });
  return obj;
}

router.get('/stats', (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    const studentsResult = db.exec("SELECT COUNT(*) as count FROM students WHERE status = 'active'");
    const totalStudents = studentsResult.length > 0 ? studentsResult[0].values[0][0] || 0 : 0;

    const staffResult = db.exec("SELECT COUNT(*) as count FROM staff WHERE status = 'active'");
    const totalStaff = staffResult.length > 0 ? staffResult[0].values[0][0] || 0 : 0;

    const collectedResult = db.exec('SELECT SUM(amount) as total FROM payments');
    const feesCollected = collectedResult.length > 0 ? collectedResult[0].values[0][0] || 0 : 0;

    const totalFeesResult = db.exec('SELECT SUM(amount) as total FROM fees');
    const totalFees = totalFeesResult.length > 0 ? totalFeesResult[0].values[0][0] || 0 : 0;
    const feesPending = Number(totalFees) - Number(feesCollected);

    const today = new Date().toISOString().split('T')[0];
    const attendanceResult = db.exec(`
      SELECT 
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance WHERE date = '${today}'
    `);

    const attendance = attendanceResult.length > 0 && attendanceResult[0].values[0][0] !== null
      ? {
          present: attendanceResult[0].values[0][0] || 0,
          absent: attendanceResult[0].values[0][1] || 0,
          late: attendanceResult[0].values[0][2] || 0,
        }
      : { present: 0, absent: 0, late: 0 };

    res.json({
      success: true,
      data: {
        totalStudents,
        totalStaff,
        feesCollected,
        feesPending,
        attendanceToday: attendance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
