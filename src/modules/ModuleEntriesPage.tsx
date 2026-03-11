import React, { useEffect, useState } from 'react';

export function ModuleEntriesPage({ moduleKey, title, companies, subcontractors, projects }: any) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', amount: 0, transaction_date: new Date().toISOString().slice(0, 10), related_company_id: 0, related_subcontractor_id: 0, related_project_id: 0, notes: '' });

  const load = async () => setRows(await window.dobiApi.listModuleEntries(moduleKey));
  useEffect(() => { load(); }, [moduleKey]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.dobiApi.createModuleEntry({ ...form, module_key: moduleKey, related_company_id: form.related_company_id || undefined, related_subcontractor_id: form.related_subcontractor_id || undefined, related_project_id: form.related_project_id || undefined });
    setForm({ title: '', amount: 0, transaction_date: new Date().toISOString().slice(0, 10), related_company_id: 0, related_subcontractor_id: 0, related_project_id: 0, notes: '' });
    load();
  };

  return (
    <div className="split">
      <form className="panel labeled-form" onSubmit={submit}>
        <h3>{title}</h3>
        <label>Başlık</label><input required value={form.title} placeholder={`${title} başlığı`} onChange={(e)=>setForm({...form,title:e.target.value})} />
        <label>Tutar</label><input type="number" value={form.amount} onChange={(e)=>setForm({...form,amount:Number(e.target.value)})} />
        <label>Tarih</label><input type="date" value={form.transaction_date} onChange={(e)=>setForm({...form,transaction_date:e.target.value})} />
        <label>Firma</label><select value={form.related_company_id} onChange={(e)=>setForm({...form,related_company_id:Number(e.target.value)})}><option value={0}>Seçiniz</option>{companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label>Taşeron</label><select value={form.related_subcontractor_id} onChange={(e)=>setForm({...form,related_subcontractor_id:Number(e.target.value)})}><option value={0}>Seçiniz</option>{subcontractors.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label>Proje</label><select value={form.related_project_id} onChange={(e)=>setForm({...form,related_project_id:Number(e.target.value)})}><option value={0}>Seçiniz</option>{projects.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <label>Açıklama</label><textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} placeholder="Not" />
        <button type="submit">Kaydet</button>
      </form>
      <section className="panel">
        <table>
          <thead><tr><th>Tarih</th><th>Başlık</th><th>Tutar</th><th>Proje</th><th>İşlem</th></tr></thead>
          <tbody>{rows.map((r)=><tr key={r.id}><td>{r.transaction_date}</td><td>{r.title}</td><td>{r.amount}</td><td>{r.project_name||'-'}</td><td><button type="button" onClick={async()=>{await window.dobiApi.deleteModuleEntry(r.id);load();}}>Sil</button></td></tr>)}</tbody>
          <tfoot><tr><td colSpan={2}><strong>Toplam</strong></td><td>{rows.reduce((a,b)=>a+Number(b.amount),0).toFixed(2)}</td><td colSpan={2}></td></tr></tfoot>
        </table>
      </section>
    </div>
  );
}
