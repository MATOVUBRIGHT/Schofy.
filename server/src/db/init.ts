import initSqlJs, { Database } from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../../database.sqlite');

let db: Database;

export async function initDatabase() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      admission_no TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT,
      gender TEXT,
      class_id TEXT,
      stream_id TEXT,
      address TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      guardian_email TEXT,
      medical_info TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      dob TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      photo_url TEXT,
      salary REAL,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      stream TEXT,
      capacity INTEGER DEFAULT 40,
      class_teacher_id TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      class_id TEXT,
      teacher_id TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      class_id TEXT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      term TEXT NOT NULL,
      year TEXT NOT NULL,
      due_date TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      fee_id TEXT,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT,
      reference TEXT,
      date TEXT NOT NULL,
      received_by TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      priority TEXT DEFAULT 'medium',
      created_by TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_id TEXT,
      term TEXT NOT NULL,
      year TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      score REAL NOT NULL,
      max_score REAL DEFAULT 100,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      period INTEGER NOT NULL,
      subject_id TEXT,
      start_time TEXT,
      end_time TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transport_routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      fee REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transport_assignments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      pickup_time TEXT,
      drop_time TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    )
  `);

  saveDatabase();
  console.log('Database initialized');
}

export function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

export function getDatabase() {
  return db;
}

export async function seedDatabase() {
  const result = db.exec("SELECT id FROM users WHERE email = 'admin@school.com'");
  if (result.length > 0 && result[0].values.length > 0) {
    console.log('Database already seeded');
    return;
  }

  const now = new Date().toISOString();
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const adminId = uuidv4();

  db.run('INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [adminId, 'admin@school.com', hashedPassword, 'admin', now, now]);

  const classes = [
    { id: uuidv4(), name: 'Primary 1', level: 1, capacity: 40 },
    { id: uuidv4(), name: 'Primary 2', level: 2, capacity: 40 },
    { id: uuidv4(), name: 'Primary 3', level: 3, capacity: 40 },
    { id: uuidv4(), name: 'JSS 1', level: 7, capacity: 35 },
    { id: uuidv4(), name: 'JSS 2', level: 8, capacity: 35 },
    { id: uuidv4(), name: 'SS 1', level: 10, capacity: 30 },
  ];

  classes.forEach(c => {
    db.run('INSERT INTO classes (id, name, level, capacity, created_at) VALUES (?, ?, ?, ?, ?)',
      [c.id, c.name, c.level, c.capacity, now]);
  });

  const subjects = [
    { id: uuidv4(), name: 'Mathematics', code: 'MATH', classId: classes[0].id },
    { id: uuidv4(), name: 'English', code: 'ENG', classId: classes[0].id },
    { id: uuidv4(), name: 'Science', code: 'SCI', classId: classes[0].id },
    { id: uuidv4(), name: 'Mathematics', code: 'MATH', classId: classes[3].id },
    { id: uuidv4(), name: 'English', code: 'ENG', classId: classes[3].id },
    { id: uuidv4(), name: 'Physics', code: 'PHY', classId: classes[5].id },
    { id: uuidv4(), name: 'Chemistry', code: 'CHEM', classId: classes[5].id },
  ];

  subjects.forEach(s => {
    db.run('INSERT INTO subjects (id, name, code, class_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [s.id, s.name, s.code, s.classId, now]);
  });

  const students = [
    { id: uuidv4(), firstName: 'Sarah', lastName: 'Johnson', gender: 'female', classId: classes[3].id, guardian: 'Mrs. Johnson', phone: '+1234567890' },
    { id: uuidv4(), firstName: 'Michael', lastName: 'Chen', gender: 'male', classId: classes[3].id, guardian: 'Mr. Chen', phone: '+1234567891' },
    { id: uuidv4(), firstName: 'Emma', lastName: 'Williams', gender: 'female', classId: classes[0].id, guardian: 'Mrs. Williams', phone: '+1234567892' },
    { id: uuidv4(), firstName: 'James', lastName: 'Brown', gender: 'male', classId: classes[1].id, guardian: 'Mr. Brown', phone: '+1234567893' },
    { id: uuidv4(), firstName: 'Olivia', lastName: 'Davis', gender: 'female', classId: classes[4].id, guardian: 'Mrs. Davis', phone: '+1234567894' },
    { id: uuidv4(), firstName: 'William', lastName: 'Miller', gender: 'male', classId: classes[5].id, guardian: 'Mr. Miller', phone: '+1234567895' },
    { id: uuidv4(), firstName: 'Sophia', lastName: 'Wilson', gender: 'female', classId: classes[0].id, guardian: 'Mrs. Wilson', phone: '+1234567896' },
    { id: uuidv4(), firstName: 'Benjamin', lastName: 'Moore', gender: 'male', classId: classes[2].id, guardian: 'Mr. Moore', phone: '+1234567897' },
  ];

  students.forEach((s, i) => {
    const admNo = `ADM/${new Date().getFullYear()}/${String(i + 1).padStart(4, '0')}`;
    db.run(`INSERT INTO students (id, admission_no, first_name, last_name, gender, class_id, guardian_name, guardian_phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [s.id, admNo, s.firstName, s.lastName, s.gender, s.classId, s.guardian, s.phone, now, now]);
  });

  const staff = [
    { id: uuidv4(), firstName: 'Rachel', lastName: 'Green', role: 'teacher', dept: 'Primary', phone: '+9876543210' },
    { id: uuidv4(), firstName: 'David', lastName: 'Chen', role: 'teacher', dept: 'Science', phone: '+9876543211' },
    { id: uuidv4(), firstName: 'Lisa', lastName: 'Anderson', role: 'director', dept: 'Administration', phone: '+9876543212' },
    { id: uuidv4(), firstName: 'Michael', lastName: 'Peters', role: 'bursar', dept: 'Finance', phone: '+9876543213' },
  ];

  staff.forEach((s, i) => {
    const empId = `EMP/${new Date().getFullYear()}/${String(i + 1).padStart(4, '0')}`;
    db.run(`INSERT INTO staff (id, employee_id, first_name, last_name, role, department, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [s.id, empId, s.firstName, s.lastName, s.role, s.dept, s.phone, now, now]);
  });

  const routes = [
    { id: uuidv4(), name: 'Route A', description: 'North District', fee: 100 },
    { id: uuidv4(), name: 'Route B', description: 'South District', fee: 100 },
    { id: uuidv4(), name: 'Route C', description: 'East District', fee: 120 },
  ];

  routes.forEach(r => {
    db.run('INSERT INTO transport_routes (id, name, description, fee, created_at) VALUES (?, ?, ?, ?, ?)',
      [r.id, r.name, r.description, r.fee, now]);
  });

  db.run('INSERT INTO settings (id, "key", value, updated_at) VALUES (?, ?, ?, ?)',
    ['school_name', 'schoolName', 'My School', now]);
  db.run('INSERT INTO settings (id, "key", value, updated_at) VALUES (?, ?, ?, ?)',
    ['academic_year', 'academicYear', new Date().getFullYear().toString(), now]);

  saveDatabase();
  console.log('Database seeded successfully');
}
