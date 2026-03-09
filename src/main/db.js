const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');
const bcrypt = require('bcryptjs');

const dataDir = path.join(app.getPath('userData'), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'santiyem.sqlite');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'normal',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_office TEXT,
  tax_number TEXT,
  opening_balance REAL DEFAULT 0,
  status TEXT DEFAULT 'aktif',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  company_id INTEGER,
  location TEXT,
  start_date TEXT,
  estimated_end_date TEXT,
  actual_end_date TEXT,
  status TEXT DEFAULT 'aktif',
  manager TEXT,
  notes TEXT,
  FOREIGN KEY(company_id) REFERENCES companies(id)
);
CREATE TABLE IF NOT EXISTS subcontractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  team_name TEXT,
  contact_person TEXT,
  phone TEXT,
  tax_identity TEXT,
  address TEXT,
  status TEXT DEFAULT 'aktif',
  start_date TEXT,
  contract_notes TEXT
);
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  phone TEXT,
  address TEXT,
  role TEXT,
  department TEXT,
  project_id INTEGER,
  monthly_salary REAL DEFAULT 0,
  daily_wage REAL DEFAULT 0,
  work_type TEXT DEFAULT 'aylik',
  hire_date TEXT,
  leave_date TEXT,
  status TEXT DEFAULT 'aktif',
  bank_info TEXT,
  notes TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  overtime_hours REAL DEFAULT 0,
  notes TEXT,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS progress_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_no TEXT,
  date TEXT NOT NULL,
  period TEXT,
  project_id INTEGER,
  company_id INTEGER,
  subcontractor_id INTEGER,
  description TEXT,
  gross_amount REAL NOT NULL,
  withholding_amount REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  net_amount REAL NOT NULL,
  status TEXT DEFAULT 'taslak',
  due_date TEXT,
  payment_date TEXT,
  notes TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  FOREIGN KEY(company_id) REFERENCES companies(id),
  FOREIGN KEY(subcontractor_id) REFERENCES subcontractors(id)
);
CREATE TABLE IF NOT EXISTS financial_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT,
  amount REAL NOT NULL,
  account_type TEXT,
  cash_account_id INTEGER,
  bank_account_id INTEGER,
  description TEXT,
  company_id INTEGER,
  subcontractor_id INTEGER,
  employee_id INTEGER,
  project_id INTEGER,
  reference_no TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS payrolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  employee_id INTEGER NOT NULL,
  gross_salary REAL DEFAULT 0,
  net_salary REAL DEFAULT 0,
  advance_deduction REAL DEFAULT 0,
  deduction REAL DEFAULT 0,
  extra_payment REAL DEFAULT 0,
  bonus REAL DEFAULT 0,
  overtime_amount REAL DEFAULT 0,
  total_payable REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'bekliyor',
  payment_date TEXT,
  notes TEXT,
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  subcategory TEXT,
  date TEXT NOT NULL,
  due_date TEXT,
  amount REAL NOT NULL,
  vat REAL DEFAULT 0,
  project_id INTEGER,
  company_id INTEGER,
  payment_channel TEXT,
  description TEXT,
  document_no TEXT
);
CREATE TABLE IF NOT EXISTS cash_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  opening_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT NOT NULL,
  iban TEXT,
  opening_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS material_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT,
  name TEXT NOT NULL,
  unit TEXT,
  category TEXT,
  description TEXT
);
CREATE TABLE IF NOT EXISTS material_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_item_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL,
  total_amount REAL,
  company_id INTEGER,
  project_id INTEGER,
  document_no TEXT,
  waybill_no TEXT,
  date TEXT NOT NULL,
  delivered_by TEXT,
  delivered_to TEXT,
  description TEXT,
  FOREIGN KEY(material_item_id) REFERENCES material_items(id)
);
CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'acik',
  related_type TEXT,
  related_id INTEGER
);
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  module TEXT,
  action TEXT,
  record_id INTEGER,
  payload TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  related_table TEXT,
  related_id INTEGER,
  file_name TEXT,
  file_path TEXT,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

db.exec(schema);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (!userCount) {
    db.prepare('INSERT INTO users (username,password_hash,role) VALUES (?,?,?)').run('admin', bcrypt.hashSync('admin123', 10), 'admin');
  }
  const companyCount = db.prepare('SELECT COUNT(*) as c FROM companies').get().c;
  if (!companyCount) {
    db.prepare('INSERT INTO companies (code,name,type,phone,opening_balance) VALUES (?,?,?,?,?)').run('C001', 'Örnek İnşaat A.Ş.', 'müşteri', '05550001122', 125000);
    db.prepare('INSERT INTO projects (code,name,location,status) VALUES (?,?,?,?)').run('P001', 'Kadıköy Konut Projesi', 'İstanbul', 'aktif');
    db.prepare('INSERT INTO subcontractors (name,team_name,status) VALUES (?,?,?)').run('Yıldız Kalıp', 'Kalıp Ekibi', 'aktif');
    db.prepare('INSERT INTO employees (full_name,role,monthly_salary,status) VALUES (?,?,?,?)').run('Ahmet Demir', 'Usta', 45000, 'aktif');
    db.prepare('INSERT INTO cash_accounts (name,opening_balance) VALUES (?,?)').run('Merkez Kasa', 50000);
    db.prepare('INSERT INTO bank_accounts (bank_name,iban,opening_balance) VALUES (?,?,?)').run('Ziraat', 'TR00 0000 0000 0000', 220000);
  }
}

seed();

module.exports = { db, dbPath, dataDir };
