const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const { db, dbPath } = require('./db');

let currentUser = null;

const MODULE_TABLES = {
  companies: 'companies',
  projects: 'projects',
  subcontractors: 'subcontractors',
  employees: 'employees',
  progressPayments: 'progress_payments',
  transactions: 'financial_transactions',
  payrolls: 'payrolls',
  expenses: 'expenses',
  materials: 'material_transactions',
  reminders: 'reminders',
  users: 'users',
  logs: 'activity_logs',
};

function logAction(module, action, recordId, payload = null) {
  db.prepare('INSERT INTO activity_logs (user_id,module,action,record_id,payload) VALUES (?,?,?,?,?)')
    .run(currentUser?.id || null, module, action, recordId || null, payload ? JSON.stringify(payload) : null);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());

ipcMain.handle('auth:login', (_, credentials) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(credentials.username);
  if (!user) return { ok: false, message: 'Kullanıcı bulunamadı' };
  const valid = bcrypt.compareSync(credentials.password, user.password_hash);
  if (!valid) return { ok: false, message: 'Şifre hatalı' };
  currentUser = { id: user.id, username: user.username, role: user.role };
  logAction('auth', 'login', user.id);
  return { ok: true, user: currentUser };
});

ipcMain.handle('auth:current', () => currentUser);
ipcMain.handle('auth:logout', () => { currentUser = null; return true; });

ipcMain.handle('crud:list', (_, { module }) => {
  const table = MODULE_TABLES[module];
  return db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
});

ipcMain.handle('crud:create', (_, { module, data }) => {
  const table = MODULE_TABLES[module];
  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(',');
  const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`);
  const info = stmt.run(...cols.map((c) => data[c]));
  logAction(module, 'create', info.lastInsertRowid, data);
  return info.lastInsertRowid;
});

ipcMain.handle('crud:update', (_, { module, id, data }) => {
  const table = MODULE_TABLES[module];
  const cols = Object.keys(data);
  const set = cols.map((c) => `${c}=?`).join(',');
  db.prepare(`UPDATE ${table} SET ${set} WHERE id=?`).run(...cols.map((c) => data[c]), id);
  logAction(module, 'update', id, data);
  return true;
});

ipcMain.handle('crud:delete', (_, { module, id }) => {
  const table = MODULE_TABLES[module];
  db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
  logAction(module, 'delete', id);
  return true;
});

ipcMain.handle('dashboard:summary', () => {
  const single = (q) => db.prepare(q).get()?.v || 0;
  return {
    totalReceivable: single("SELECT COALESCE(SUM(CASE WHEN type='firmadan_tahsilat' THEN amount ELSE 0 END),0) v FROM financial_transactions"),
    totalPayable: single("SELECT COALESCE(SUM(CASE WHEN type IN ('firmaya_odeme','diger_odeme') THEN amount ELSE 0 END),0) v FROM financial_transactions"),
    monthlyProgress: single("SELECT COALESCE(SUM(net_amount),0) v FROM progress_payments WHERE strftime('%Y-%m', date)=strftime('%Y-%m','now')"),
    monthlyPayments: single("SELECT COALESCE(SUM(amount),0) v FROM financial_transactions WHERE type LIKE '%odeme%' AND strftime('%Y-%m', date)=strftime('%Y-%m','now')"),
    monthlyCollections: single("SELECT COALESCE(SUM(amount),0) v FROM financial_transactions WHERE type='firmadan_tahsilat' AND strftime('%Y-%m', date)=strftime('%Y-%m','now')"),
    cashBalance: single("SELECT COALESCE(SUM(opening_balance),0) + COALESCE((SELECT SUM(CASE WHEN type IN ('firmadan_tahsilat','diger_gelir') THEN amount ELSE -amount END) FROM financial_transactions WHERE account_type='kasa'),0) v FROM cash_accounts"),
    bankBalance: single("SELECT COALESCE(SUM(opening_balance),0) + COALESCE((SELECT SUM(CASE WHEN type IN ('firmadan_tahsilat','diger_gelir') THEN amount ELSE -amount END) FROM financial_transactions WHERE account_type='banka'),0) v FROM bank_accounts"),
    pendingReminders: db.prepare("SELECT * FROM reminders WHERE status='acik' ORDER BY due_date LIMIT 5").all(),
    recentTransactions: db.prepare('SELECT * FROM financial_transactions ORDER BY id DESC LIMIT 8').all(),
  };
});

ipcMain.handle('export:excel', async (_, { rows, fileName }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: `${fileName}.xlsx` });
  if (canceled || !filePath) return null;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Veriler');
  XLSX.writeFile(wb, filePath);
  return filePath;
});

ipcMain.handle('backup:create', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: `santiyem-backup-${Date.now()}.sqlite` });
  if (canceled || !filePath) return null;
  fs.copyFileSync(dbPath, filePath);
  return filePath;
});

ipcMain.handle('backup:restore', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'SQLite', extensions: ['sqlite', 'db'] }] });
  if (canceled || !filePaths[0]) return null;
  fs.copyFileSync(filePaths[0], dbPath);
  return true;
});
