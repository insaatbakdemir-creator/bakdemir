import React, { useEffect, useState } from 'react';

export function ProjectsPage({ projects, companies, subcontractors, onRefresh }: any) {
  const [selected, setSelected] = useState<any | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [equipmentRows, setEquipmentRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ code: '', name: '', linked_company_id: 0, status: 'DEVAM', location: '', subcontractor_ids: [] as number[] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await window.dobiApi.createProject({ ...form, linked_company_id: form.linked_company_id || undefined });
    if (!res.ok) {
      setMsg('Proje kaydedilemedi. Kod benzersiz olmalı.');
      return;
    }
    setForm({ code: '', name: '', linked_company_id: 0, status: 'DEVAM', location: '', subcontractor_ids: [] });
    await onRefresh();
    setMsg('Proje eklendi.');
  };

  useEffect(() => {
    if (!selected) return;
    window.dobiApi.projectFinancialSummary(selected.id).then(setSummary);
    window.dobiApi.listModuleEntries('ekipman_hizmet').then((rows) => setEquipmentRows(rows.filter((r: any) => r.related_project_id === selected.id)));
  }, [selected]);

  return (
    <div className="module-stack">
      <section className="panel">
        <h3>Proje Yönetimi</h3>
        <form className="inline-form" onSubmit={submit}>
          <label>Proje Kodu</label><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <label>Proje Adı</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Firma</label><select value={form.linked_company_id} onChange={(e) => setForm({ ...form, linked_company_id: Number(e.target.value) })}>{companies.length === 0 ? <option value={0}>Önce firma ekleyin</option> : <option value={0}>Seçiniz</option>}{companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label>Lokasyon</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label>Durum</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>DEVAM</option><option>TAMAMLANDI</option><option>BEKLEME</option></select>
          <label>Taşeron Bağla</label>
          <select multiple value={form.subcontractor_ids.map(String)} onChange={(e) => setForm({ ...form, subcontractor_ids: Array.from(e.target.selectedOptions).map((o) => Number(o.value)) })}>
            {subcontractors.length === 0 ? <option value={0}>Önce taşeron ekleyin</option> : null}
            {subcontractors.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit">Proje Ekle</button>
        </form>
        {msg ? <small>{msg}</small> : null}
      </section>

      <section className="panel">
        <table>
          <thead><tr><th>Kod</th><th>Proje</th><th>Firma</th><th>Durum</th></tr></thead>
          <tbody>{projects.map((p: any) => <tr key={p.id} onClick={() => setSelected(p)} className={selected?.id === p.id ? 'selected-row' : ''}><td>{p.code}</td><td>{p.name}</td><td>{p.company_name || '-'}</td><td>{p.status}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="panel">
        <h3>Proje Finansal Özet {selected ? `- ${selected.name}` : ''}</h3>
        {summary ? <div className="summary-inline"><span>Gelir: {summary.total_income?.toFixed(2)}</span><span>Gider: {summary.total_expense?.toFixed(2)}</span><span>Hakediş: {summary.total_hakedis?.toFixed(2)}</span><span>Ödeme: {summary.total_odeme?.toFixed(2)}</span><span>Tahmini Karlılık: {(summary.total_income - summary.total_expense).toFixed(2)}</span></div> : <p>Proje seçin.</p>}
        <h4>Bağlı Ekipman/Hizmet</h4>
        <table><thead><tr><th>Tarih</th><th>Başlık</th><th>Tutar</th></tr></thead><tbody>{equipmentRows.map((r) => <tr key={r.id}><td>{r.transaction_date}</td><td>{r.title}</td><td>{r.amount}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
