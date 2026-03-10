import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export let db: Database.Database;

export function initDatabase(userDataPath: string) {
  const dataDir = path.join(userDataPath, 'dobi-data');
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'dobi.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  runMigrations(db);
  seed(db);
}

function runMigrations(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT,
      company_type TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tax_number TEXT,
      notes TEXT,
      opening_balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'AKTIF',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      linked_company_id INTEGER,
      location TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'DEVAM',
      notes TEXT,
      FOREIGN KEY(linked_company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS subcontractors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_name TEXT,
      contact_name TEXT,
      phone TEXT,
      identity_no TEXT,
      address TEXT,
      expertise TEXT,
      status TEXT NOT NULL DEFAULT 'AKTIF',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      title TEXT,
      phone TEXT,
      salary_type TEXT NOT NULL,
      monthly_salary REAL DEFAULT 0,
      daily_wage REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'AKTIF'
    );

    CREATE TABLE IF NOT EXISTS promissory_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_no TEXT NOT NULL,
      note_type TEXT NOT NULL,
      related_party_type TEXT NOT NULL,
      related_party_id INTEGER NOT NULL,
      project_id INTEGER,
      amount REAL NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACIK',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_type TEXT NOT NULL,
      flow_direction TEXT NOT NULL,
      related_party_type TEXT NOT NULL,
      related_party_id INTEGER NOT NULL,
      project_id INTEGER,
      document_no TEXT,
      transaction_date TEXT NOT NULL,
      due_date TEXT,
      payment_channel TEXT,
      amount REAL NOT NULL,
      withholding_amount REAL NOT NULL DEFAULT 0,
      other_deduction_amount REAL NOT NULL DEFAULT 0,
      material_deduction_amount REAL NOT NULL DEFAULT 0,
      equipment_deduction_amount REAL NOT NULL DEFAULT 0,
      quantity REAL,
      unit TEXT,
      unit_price REAL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACIK',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE VIEW IF NOT EXISTS subcontractor_balance_view AS
    SELECT
      s.id,
      s.name,
      COALESCE(SUM(CASE WHEN t.transaction_type = 'HAKEDIS' THEN t.amount ELSE 0 END), 0) AS total_progress,
      COALESCE(SUM(CASE WHEN t.transaction_type = 'YEVMIYE' THEN t.amount ELSE 0 END), 0) AS total_daily,
      COALESCE(SUM(CASE WHEN t.transaction_type = 'AVANS' THEN t.amount ELSE 0 END), 0) AS total_advance,
      COALESCE(SUM(CASE WHEN t.transaction_type = 'ODEME' THEN t.amount ELSE 0 END), 0) AS total_payment,
      COALESCE(SUM(CASE WHEN t.transaction_type = 'KESINTI' THEN t.amount ELSE 0 END), 0) AS total_deduction,
      COALESCE(SUM(t.material_deduction_amount), 0) AS total_material_deduction,
      COALESCE(SUM(t.equipment_deduction_amount), 0) AS total_equipment_deduction,
      (
        COALESCE(SUM(CASE WHEN t.transaction_type = 'HAKEDIS' THEN t.amount ELSE 0 END), 0) +
        COALESCE(SUM(CASE WHEN t.transaction_type = 'YEVMIYE' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.transaction_type = 'AVANS' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.transaction_type = 'ODEME' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.transaction_type = 'KESINTI' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(t.material_deduction_amount), 0) -
        COALESCE(SUM(t.equipment_deduction_amount), 0)
      ) AS net_receivable
    FROM subcontractors s
    LEFT JOIN transactions t ON t.related_party_type = 'TASERON' AND t.related_party_id = s.id
    GROUP BY s.id, s.name;
  `);
}

function seed(conn: Database.Database) {
  const count = conn.prepare('SELECT COUNT(*) AS c FROM projects').get() as { c: number };
  if (count.c > 0) return;

  conn.prepare("INSERT INTO companies (code, name, short_name, company_type, contact_name, phone, opening_balance) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run('C001', 'Örnek Müteahhit A.Ş.', 'Örnek', 'MUTEAHHIT', 'Ahmet Yıldız', '05321234567', 150000);

  conn.prepare("INSERT INTO projects (code, name, linked_company_id, location, start_date, status) VALUES (?, ?, ?, ?, ?, ?)")
    .run('P001', 'Ataşehir Konut Projesi', 1, 'İstanbul', '2026-01-15', 'DEVAM');

  conn.prepare("INSERT INTO subcontractors (name, team_name, contact_name, phone, expertise) VALUES (?, ?, ?, ?, ?)")
    .run('Demir Ustaları Ltd.', 'Demir Ekibi', 'Mustafa Demir', '05335557788', 'Demir');

  conn.prepare("INSERT INTO personnel (full_name, title, phone, salary_type, monthly_salary, daily_wage) VALUES (?, ?, ?, ?, ?, ?)")
    .run('Mehmet Kara', 'Şantiye Şefi', '05324445566', 'AYLIK', 45000, 0);
}
