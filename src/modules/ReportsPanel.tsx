import React, { useState } from 'react';

export function ReportsPanel({ subcontractors }: { subcontractors: Array<{ id: number; name: string }> }) {
  const [selected, setSelected] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (!selected) return;
    const data = await window.dobiApi.reportSubcontractorLedger(selected);
    setRows(data.ledger);
    setSummary(data.summary);
  };

  const exportExcel = async () => {
    if (!selected) return;
    const res = await window.dobiApi.exportSubcontractorLedgerExcel(selected);
    setMsg(res.ok ? `Excel oluşturuldu: ${res.filePath}` : res.message ?? 'Hata');
  };

  const print = async () => {
    const html = `
      <html><body>
      <h2>DOBİ - Taşeron Hesap Özeti</h2>
      <p>Toplam Hakediş: ${summary?.total_progress ?? 0}</p>
      <p>Toplam Yevmiye: ${summary?.total_daily ?? 0}</p>
      <p>Kalan Net Alacak: ${summary?.net_receivable ?? 0}</p>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Tarih</th><th>Tür</th><th>Tutar</th><th>Açıklama</th></tr>
        ${rows.map((r) => `<tr><td>${r.transaction_date}</td><td>${r.transaction_type}</td><td>${r.amount}</td><td>${r.description}</td></tr>`).join('')}
      </table>
      </body></html>
    `;
    await window.dobiApi.printHtml(html, 'Taşeron Ekstresi');
  };

  return (
    <section className="panel">
      <h3>Raporlama: Taşeron Hesap Ekstresi</h3>
      <div className="row">
        <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
          <option value={0}>Taşeron seçin</option>
          {subcontractors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={load}>Raporu Getir</button>
        <button onClick={exportExcel}>Excel Aktar</button>
        <button onClick={print}>Yazdır</button>
      </div>
      {summary && (
        <div className="summary-inline">
          <span>Hakediş: {summary.total_progress}</span>
          <span>Yevmiye: {summary.total_daily}</span>
          <span>Avans: {summary.total_advance}</span>
          <span>Ödeme: {summary.total_payment}</span>
          <span>Kesinti: {summary.total_deduction}</span>
          <span className="danger">Net Alacak: {summary.net_receivable}</span>
        </div>
      )}
      <table>
        <thead>
          <tr><th>Tarih</th><th>Tür</th><th>Tutar</th><th>Vade</th><th>Durum</th><th>Açıklama</th></tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.transaction_date}</td><td>{r.transaction_type}</td><td>{r.amount}</td><td>{r.due_date ?? '-'}</td>
              <td className={r.status === 'ACIK' && r.due_date && r.due_date < new Date().toISOString().slice(0, 10) ? 'danger' : ''}>{r.status}</td>
              <td>{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg ? <small>{msg}</small> : null}
    </section>
  );
}
