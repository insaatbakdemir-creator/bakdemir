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

export function createHandlers({ ipcMain, db, dialog, app }: { ipcMain: IpcMain; db: Database.Database; dialog: Dialog; app: App }) {
  ipcMain.handle('dashboard:getSummary', () => {
    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN flow_direction='GELIR' THEN amount ELSE 0 END),0) AS toplam_tahsilat,
        COALESCE(SUM(CASE WHEN flow_direction='GIDER' THEN amount ELSE 0 END),0) AS toplam_odeme,
        COALESCE(SUM(CASE WHEN transaction_type='ODEME' AND related_party_type='TASERON' THEN amount ELSE 0 END),0) AS taseron_odeme_ay,
        COALESCE(SUM(CASE WHEN transaction_type='HAKEDIS' THEN amount ELSE 0 END),0) AS hakedis_ay,
        COALESCE(SUM(CASE WHEN due_date < date('now') AND status='ACIK' AND flow_direction='GIDER' THEN amount ELSE 0 END),0) AS gecikmis_odeme,
        COALESCE(SUM(CASE WHEN due_date < date('now') AND status='ACIK' AND flow_direction='GELIR' THEN amount ELSE 0 END),0) AS gecikmis_tahsilat
      FROM transactions
      WHERE strftime('%Y-%m', transaction_date) = strftime('%Y-%m', 'now')
    `).get() as Record<string, number>;

    const subcontractorTotals = db.prepare('SELECT COALESCE(SUM(net_receivable),0) AS total_net FROM subcontractor_balance_view').get() as Record<string, number>;
    const openNotes = db.prepare("SELECT COALESCE(SUM(amount),0) AS open_notes FROM promissory_notes WHERE status='ACIK'").get() as Record<string, number>;

    return { ...summary, ...subcontractorTotals, ...openNotes };
  });

  ipcMain.handle('project:list', () => db.prepare('SELECT * FROM projects ORDER BY id DESC').all());
  ipcMain.handle('subcontractor:list', () => db.prepare('SELECT * FROM subcontractors ORDER BY name').all());
  ipcMain.handle('company:list', () => db.prepare('SELECT * FROM companies ORDER BY name').all());
  ipcMain.handle('personnel:list', () => db.prepare('SELECT * FROM personnel ORDER BY full_name').all());

  ipcMain.handle('transaction:recent', () => db.prepare(`
    SELECT id, transaction_type, flow_direction, related_party_type, related_party_id, project_id, transaction_date, due_date, amount, description, status
    FROM transactions
    ORDER BY transaction_date DESC, id DESC
    LIMIT 20
  `).all());

  ipcMain.handle('transaction:create', (_event, payload) => {
    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      return { ok: false, errors: parsed.error.issues };
    }
    const p = parsed.data;
    db.prepare(`
      INSERT INTO transactions (
        transaction_type, flow_direction, related_party_type, related_party_id, project_id,
        transaction_date, due_date, payment_channel, amount, material_deduction_amount,
        equipment_deduction_amount, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      p.description
    );

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
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

    sheet.addRow([]);
    const header = sheet.addRow(['Tarih', 'İşlem Türü', 'Tutar', 'Malzeme Kesintisi', 'Ekipman Kesintisi', 'Açıklama', 'Vade', 'Durum']);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    report.forEach((row) => {
      sheet.addRow([
        row.transaction_date,
        row.transaction_type,
        row.amount,
        row.material_deduction_amount,
        row.equipment_deduction_amount,
        row.description,
        row.due_date,
        row.status
      ]);
    });

    sheet.columns = [
      { width: 14 },
      { width: 16 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 38 },
      { width: 14 },
      { width: 12 }
    ];

    [3, 4, 5].forEach((col) => {
      sheet.getColumn(col).numFmt = '#,##0.00 [$₺-tr-TR]';
    });

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

    const { response } = await dialog.showMessageBox({
      type: 'question',
      message: `${title} raporu yazdırılsın mı?`,
      buttons: ['Evet', 'Vazgeç']
    });

    if (response === 0) {
      await (win.webContents as WebContents).print({ printBackground: true, silent: false });
      win.destroy();
      return { ok: true };
    }

    win.destroy();
    return { ok: false, message: 'Yazdırma iptal edildi.' };
  });
}
