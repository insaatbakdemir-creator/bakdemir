import type { IpcMain, App, Dialog, WebContents } from 'electron';
import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import type Database from 'better-sqlite3';

const transactionSchema = z.object({
  transaction_type: z.enum(['HAKEDIS', 'YEVMIYE', 'AVANS', 'ODEME', 'KESINTI', 'TAHSILAT', 'DIGER_GIDER', 'DIGER_GELIR']),
  flow_direction: z.enum(['GELIR', 'GIDER', 'NÖTR']),
  related_party_type: z.enum(['FIRMA', 'TASERON', 'PERSONEL', 'TEDARIKCI']),
  related_party_id: z.number().int().positive(),
  project_id: z.number().int().positive().optional(),
  transaction_date: z.string(),
  due_date: z.string().optional(),
  payment_channel: z.string().optional(),
  amount: z.number().positive(),
  material_deduction_amount: z.number().nonnegative().default(0),
  equipment_deduction_amount: z.number().nonnegative().default(0),
  description: z.string().min(3)
});

const companySchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  company_type: z.enum(['MUSTERI', 'MUTEAHHIT', 'TEDARIKCI', 'TASERON', 'KARMA']),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  opening_balance: z.number().default(0),
  status: z.enum(['AKTIF', 'PASIF']).default('AKTIF')
});

const subcontractorSchema = z.object({
  name: z.string().min(2),
  team_name: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  expertise: z.string().optional(),
  status: z.enum(['AKTIF', 'PASIF']).default('AKTIF'),
  notes: z.string().optional()
});

const projectSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  linked_company_id: z.number().int().positive().optional(),
  location: z.string().optional(),
  status: z.enum(['DEVAM', 'TAMAMLANDI', 'BEKLEME']).default('DEVAM'),
  subcontractor_ids: z.array(z.number().int().positive()).default([])
});

const moduleEntrySchema = z.object({
  module_key: z.string().min(2),
  title: z.string().min(2),
  amount: z.number().default(0),
  transaction_date: z.string(),
  related_company_id: z.number().int().positive().optional(),
  related_subcontractor_id: z.number().int().positive().optional(),
  related_project_id: z.number().int().positive().optional(),
  notes: z.string().optional()
});

function defaultStatusByType(type: string): string {
  if (type === 'HAKEDIS' || type === 'YEVMIYE') return 'ONAYLANDI';
  if (type === 'AVANS' || type === 'ODEME' || type === 'KESINTI' || type === 'TAHSILAT') return 'TAMAMLANDI';
  return 'AKTIF';
}

export function createHandlers({ ipcMain, db, dialog, app }: { ipcMain: IpcMain; db: Database.Database; dialog: Dialog; app: App }) {
  ipcMain.handle('dashboard:getSummary', () => {
    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN flow_direction='GELIR' THEN amount ELSE 0 END),0) AS toplam_tahsilat,
        COALESCE(SUM(CASE WHEN flow_direction='GIDER' THEN amount ELSE 0 END),0) AS toplam_odeme,
        COALESCE(SUM(CASE WHEN transaction_type='ODEME' AND related_party_type='TASERON' THEN amount ELSE 0 END),0) AS taseron_odeme_ay,
        COALESCE(SUM(CASE WHEN transaction_type='HAKEDIS' THEN amount ELSE 0 END),0) AS hakedis_ay
      FROM transactions
      WHERE strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `).get() as Record<string, number>;
    const subcontractorTotals = db.prepare('SELECT COALESCE(SUM(net_receivable),0) AS total_net FROM subcontractor_balance_view').get() as Record<string, number>;
    const openNotes = db.prepare("SELECT COALESCE(SUM(amount),0) AS open_notes FROM promissory_notes WHERE status='ACIK'").get() as Record<string, number>;
    return { ...summary, ...subcontractorTotals, ...openNotes };
  });

  ipcMain.handle('company:list', () => db.prepare('SELECT * FROM companies ORDER BY id DESC').all());
  ipcMain.handle('company:create', (_event, payload) => {
    const parsed = companySchema.safeParse(payload);
    if (!parsed.success) return { ok: false, errors: parsed.error.issues };
    const p = parsed.data;
    db.prepare(`
      INSERT INTO companies (code, name, company_type, contact_name, phone, opening_balance, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.code, p.name, p.company_type, p.contact_name ?? null, p.phone ?? null, p.opening_balance, p.status);
    return { ok: true };
  });

  ipcMain.handle('company:balances', () => db.prepare(`
    SELECT
      c.*,
      COALESCE(SUM(CASE WHEN t.flow_direction='GELIR' THEN t.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN t.flow_direction='GIDER' THEN t.amount ELSE 0 END), 0) AS total_expense,
      c.opening_balance + COALESCE(SUM(CASE WHEN t.flow_direction='GELIR' THEN t.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN t.flow_direction='GIDER' THEN t.amount ELSE 0 END), 0) AS current_balance,
      COALESCE(SUM(CASE WHEN t.due_date < date('now') AND t.status NOT IN ('ODENDI','TAHSIL_EDILDI','TAMAMLANDI') THEN t.amount ELSE 0 END),0) AS overdue_amount
    FROM companies c
    LEFT JOIN transactions t ON t.related_party_type IN ('FIRMA', 'TEDARIKCI') AND t.related_party_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all());

  ipcMain.handle('subcontractor:list', () => db.prepare('SELECT * FROM subcontractors ORDER BY id DESC').all());
  ipcMain.handle('subcontractor:create', (_event, payload) => {
    const parsed = subcontractorSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, errors: parsed.error.issues };
    const p = parsed.data;
    db.prepare(`
      INSERT INTO subcontractors (name, team_name, contact_name, phone, expertise, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(p.name, p.team_name ?? null, p.contact_name ?? null, p.phone ?? null, p.expertise ?? null, p.status, p.notes ?? null);
    return { ok: true };
  });

  ipcMain.handle('subcontractor:managementList', () => db.prepare(`
    SELECT
      s.id,
      s.name,
      COALESCE(s.team_name, s.expertise, '-') AS expertise,
      s.phone,
      s.status,
      s.notes,
      COALESCE(ps.project_count,0) AS project_count,
      COALESCE(SUM(CASE WHEN t.transaction_type='HAKEDIS' THEN t.amount ELSE 0 END),0) AS total_progress,
      COALESCE(SUM(CASE WHEN t.transaction_type='ODEME' THEN t.amount ELSE 0 END),0) AS total_payment,
      COALESCE(SUM(CASE WHEN t.transaction_type='AVANS' THEN t.amount ELSE 0 END),0) AS total_advance,
      COALESCE(SUM(CASE WHEN t.transaction_type='KESINTI' THEN t.amount ELSE 0 END),0) AS total_deduction,
      0 AS extra_balance,
      (
        COALESCE(SUM(CASE WHEN t.transaction_type='HAKEDIS' THEN t.amount ELSE 0 END),0)
        - COALESCE(SUM(CASE WHEN t.transaction_type='ODEME' THEN t.amount ELSE 0 END),0)
        - COALESCE(SUM(CASE WHEN t.transaction_type='AVANS' THEN t.amount ELSE 0 END),0)
        - COALESCE(SUM(CASE WHEN t.transaction_type='KESINTI' THEN t.amount ELSE 0 END),0)
      ) AS net_balance
    FROM subcontractors s
    LEFT JOIN transactions t ON t.related_party_type='TASERON' AND t.related_party_id=s.id
    LEFT JOIN (
      SELECT subcontractor_id, COUNT(*) AS project_count FROM project_subcontractors GROUP BY subcontractor_id
    ) ps ON ps.subcontractor_id=s.id
    GROUP BY s.id
    ORDER BY s.name
  `).all());

  ipcMain.handle('project:list', () => db.prepare(`
    SELECT p.*, c.name AS company_name
    FROM projects p
    LEFT JOIN companies c ON c.id = p.linked_company_id
    ORDER BY p.id DESC
  `).all());

  ipcMain.handle('project:create', (_event, payload) => {
    const parsed = projectSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, errors: parsed.error.issues };
    const p = parsed.data;
    const tx = db.transaction(() => {
      const inserted = db.prepare(`
        INSERT INTO projects (code, name, linked_company_id, location, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(p.code, p.name, p.linked_company_id ?? null, p.location ?? null, p.status);
      for (const sid of p.subcontractor_ids) {
        db.prepare('INSERT OR IGNORE INTO project_subcontractors (project_id, subcontractor_id) VALUES (?, ?)').run(inserted.lastInsertRowid, sid);
      }
    });
    tx();
    return { ok: true };
  });

  ipcMain.handle('project:financialSummary', (_event, projectId: number) => db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN flow_direction='GELIR' THEN amount ELSE 0 END),0) AS total_income,
      COALESCE(SUM(CASE WHEN flow_direction='GIDER' THEN amount ELSE 0 END),0) AS total_expense,
      COALESCE(SUM(CASE WHEN transaction_type='HAKEDIS' THEN amount ELSE 0 END),0) AS total_hakedis,
      COALESCE(SUM(CASE WHEN transaction_type='ODEME' THEN amount ELSE 0 END),0) AS total_odeme
    FROM transactions
    WHERE project_id=?
  `).get(projectId));

  ipcMain.handle('personnel:list', () => db.prepare('SELECT id, full_name FROM personnel ORDER BY full_name').all());

  ipcMain.handle('transaction:recent', () => db.prepare(`
    SELECT id, transaction_type, flow_direction, related_party_type, related_party_id, project_id, transaction_date, due_date, amount, description, status
    FROM transactions ORDER BY id DESC LIMIT 40
  `).all());

  ipcMain.handle('transaction:listByType', (_event, type: string, relatedPartyId: number) => db.prepare(`
    SELECT id, transaction_date, amount, description, status
    FROM transactions
    WHERE transaction_type=? AND related_party_id=?
    ORDER BY transaction_date DESC, id DESC
  `).all(type, relatedPartyId));

  ipcMain.handle('transaction:create', (_event, payload) => {
    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, errors: parsed.error.issues };
    const p = parsed.data;
    db.prepare(`
      INSERT INTO transactions (
        transaction_type, flow_direction, related_party_type, related_party_id, project_id,
        transaction_date, due_date, payment_channel, amount, material_deduction_amount,
        equipment_deduction_amount, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.transaction_type,
      p.flow_direction,
      p.related_party_type,
      p.related_party_id,
      p.project_id ?? null,
      p.transaction_date,
      p.due_date ?? null,
      p.payment_channel ?? null,
      p.amount,
      p.material_deduction_amount,
      p.equipment_deduction_amount,
      p.description,
      defaultStatusByType(p.transaction_type)
    );
    return { ok: true };
  });

  ipcMain.handle('module-entry:list', (_event, moduleKey: string) => db.prepare(`
    SELECT me.*, p.name AS project_name
    FROM module_entries me
    LEFT JOIN projects p ON p.id = me.related_project_id
    WHERE me.module_key=?
    ORDER BY me.transaction_date DESC, me.id DESC
  `).all(moduleKey));

  ipcMain.handle('module-entry:create', (_event, payload) => {
    const parsed = moduleEntrySchema.safeParse(payload);
    if (!parsed.success) return { ok: false, errors: parsed.error.issues };
    const m = parsed.data;
    db.prepare(`
      INSERT INTO module_entries (module_key, title, amount, transaction_date, related_company_id, related_subcontractor_id, related_project_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(m.module_key, m.title, m.amount, m.transaction_date, m.related_company_id ?? null, m.related_subcontractor_id ?? null, m.related_project_id ?? null, m.notes ?? null);
    return { ok: true };
  });

  ipcMain.handle('module-entry:delete', (_event, id: number) => {
    db.prepare('DELETE FROM module_entries WHERE id=?').run(id);
    return { ok: true };
  });

  ipcMain.handle('report:subcontractorLedger', (_event, subcontractorId: number) => {
    const ledger = db.prepare(`
      SELECT transaction_date, transaction_type, amount, material_deduction_amount, equipment_deduction_amount, description, due_date, status
      FROM transactions
      WHERE related_party_type='TASERON' AND related_party_id=?
      ORDER BY transaction_date DESC
    `).all(subcontractorId);
    const summary = db.prepare('SELECT * FROM subcontractor_balance_view WHERE id=?').get(subcontractorId);
    return { ledger, summary };
  });

  ipcMain.handle('report:subcontractorLedgerExcel', async (_event, subcontractorId: number) => {
    const subcontractor = db.prepare('SELECT name FROM subcontractors WHERE id=?').get(subcontractorId) as { name: string } | undefined;
    if (!subcontractor) return { ok: false, message: 'Taşeron bulunamadı.' };

    const report = db.prepare(`
      SELECT transaction_date, transaction_type, amount, material_deduction_amount, equipment_deduction_amount, description, due_date, status
      FROM transactions
      WHERE related_party_type='TASERON' AND related_party_id=?
      ORDER BY transaction_date DESC
    `).all(subcontractorId) as any[];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Taşeron Ekstresi');
    sheet.mergeCells('A1:H1');
    sheet.getCell('A1').value = `DOBİ | Taşeron Hesap Ekstresi | ${subcontractor.name}`;
    sheet.getCell('A1').font = { bold: true, size: 15 };
    sheet.addRow([]);
    sheet.addRow(['Tarih', 'İşlem Türü', 'Tutar', 'Malzeme Kesintisi', 'Ekipman Kesintisi', 'Açıklama', 'Vade', 'Durum']);
    report.forEach((row) => sheet.addRow([row.transaction_date, row.transaction_type, row.amount, row.material_deduction_amount, row.equipment_deduction_amount, row.description, row.due_date, row.status]));

    const exportDir = path.join(app.getPath('documents'), 'DOBI-Raporlar');
    fs.mkdirSync(exportDir, { recursive: true });
    const filePath = path.join(exportDir, `dobi_taseron_ekstre_${subcontractorId}_${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return { ok: true, filePath };
  });

  ipcMain.handle('print:html', async (_event, { html, title }: { html: string; title: string }) => {
    const { BrowserWindow } = await import('electron');
    const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const { response } = await dialog.showMessageBox({ type: 'question', message: `${title} raporu yazdırılsın mı?`, buttons: ['Evet', 'Vazgeç'] });
    if (response === 0) {
      await (win.webContents as WebContents).print({ printBackground: true, silent: false });
      win.destroy();
      return { ok: true };
    }
    win.destroy();
    return { ok: false, message: 'Yazdırma iptal edildi.' };
  });
}
