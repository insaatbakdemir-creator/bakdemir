import React, { useMemo, useState } from 'react';

type Row = {
  id: number;
  name: string;
  expertise?: string;
  phone?: string;
  project_count: number;
  total_progress: number;
  total_payment: number;
  total_advance: number;
  total_deduction: number;
  extra_balance: number;
  net_balance: number;
  status: string;
  notes?: string;
};

export function SubcontractorsPage({ rows, onRefresh }: { rows: Row[]; onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(rows[0]?.id ?? null);
  const [tab, setTab] = useState('GENEL');
  const [form, setForm] = useState({ name: '', team_name: '', contact_name: '', phone: '', expertise: '', status: 'AKTIF', notes: '' });

  const filtered = useMemo(() => rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.dobiApi.createSubcontractor(form);
    setForm({ name: '', team_name: '', contact_name: '', phone: '', expertise: '', status: 'AKTIF', notes: '' });
    await onRefresh();
  };

  const tabs = ['GENEL', 'HAKEDISLER', 'ODEMELER', 'AVANSLAR', 'KESINTILER', 'SENETLER', 'NOTLAR'];

  return (
    <div className="module-stack">
      <section className="panel">
        <h3>Taşeron Yönetimi</h3>
        <div className="row">
          <input placeholder="Taşeron ara" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <form className="inline-form" onSubmit={submit}>
          <label>Taşeron Adı</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Örn: Demir Ustaları" />
          <label>Ekip/Branş</label><input value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="Kalıp, Demir..." />
          <label>Telefon</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xx..." />
          <button type="submit">Yeni Taşeron Ekle</button>
        </form>
      </section>

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Taşeron Adı</th><th>Ekip/Branş</th><th>Telefon</th><th>Proje Sayısı</th><th>Toplam Hakediş</th><th>Toplam Ödeme</th><th>Toplam Avans</th><th>Toplam Kesinti</th><th>Kalan Borç/Alacak</th><th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => setSelectedId(r.id)} className={selectedId === r.id ? 'selected-row' : ''}>
                <td>{r.name}</td>
                <td>{r.expertise ?? '-'}</td>
                <td>{r.phone ?? '-'}</td>
                <td>{r.project_count}</td>
                <td>{r.total_progress.toFixed(2)}</td>
                <td>{r.total_payment.toFixed(2)}</td>
                <td>{r.total_advance.toFixed(2)}</td>
                <td>{r.total_deduction.toFixed(2)}</td>
                <td className={r.net_balance < 0 ? 'danger' : ''}>{r.net_balance.toFixed(2)}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}><strong>Toplam</strong></td>
              <td>{filtered.reduce((a, b) => a + b.total_progress, 0).toFixed(2)}</td>
              <td>{filtered.reduce((a, b) => a + b.total_payment, 0).toFixed(2)}</td>
              <td>{filtered.reduce((a, b) => a + b.total_advance, 0).toFixed(2)}</td>
              <td>{filtered.reduce((a, b) => a + b.total_deduction, 0).toFixed(2)}</td>
              <td>{filtered.reduce((a, b) => a + b.net_balance, 0).toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="panel">
        <h3>Taşeron Detayı {selected ? `- ${selected.name}` : ''}</h3>
        <div className="tab-row">
          {tabs.map((t) => <button type="button" key={t} className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        {selected ? (
          <div>
            {tab === 'GENEL' && <p>Net bakiye: <strong>{selected.net_balance.toFixed(2)}</strong> | Ek borç/fark: {selected.extra_balance.toFixed(2)}</p>}
            {tab === 'HAKEDISLER' && <TransactionList id={selected.id} type="HAKEDIS" />}
            {tab === 'ODEMELER' && <TransactionList id={selected.id} type="ODEME" />}
            {tab === 'AVANSLAR' && <TransactionList id={selected.id} type="AVANS" />}
            {tab === 'KESINTILER' && <TransactionList id={selected.id} type="KESINTI" />}
            {tab === 'SENETLER' && <p>Senet sekmesi için senet modülü entegrasyonu hazır.</p>}
            {tab === 'NOTLAR' && <p>{selected.notes || 'Not bulunmuyor.'}</p>}
          </div>
        ) : <p>Kayıt seçin.</p>}
      </section>
    </div>
  );
}

function TransactionList({ id, type }: { id: number; type: string }) {
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(() => {
    window.dobiApi.listTransactionsByType(type, id).then(setRows);
  }, [id, type]);

  return (
    <table>
      <thead><tr><th>Tarih</th><th>Tutar</th><th>Açıklama</th><th>Durum</th></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.id}><td>{r.transaction_date}</td><td>{r.amount}</td><td>{r.description}</td><td>{r.status}</td></tr>)}</tbody>
    </table>
  );
}
