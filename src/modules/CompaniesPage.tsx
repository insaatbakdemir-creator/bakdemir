import React, { useMemo, useState } from 'react';

export function CompaniesPage({ rows, movements, onRefresh }: { rows: any[]; movements: any[]; onRefresh: () => Promise<void> }) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<'name'|'current_balance'>('name');
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({ code: '', name: '', company_type: 'MUSTERI', opening_balance: 0, contact_name: '', phone: '', status: 'AKTIF' });
  const filtered = useMemo(() => rows
    .filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a,b)=> sort==='name'? a.name.localeCompare(b.name): b.current_balance-a.current_balance), [rows, filter, sort]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.dobiApi.createCompany(form);
    setForm({ code: '', name: '', company_type: 'MUSTERI', opening_balance: 0, contact_name: '', phone: '', status: 'AKTIF' });
    await onRefresh();
  };

  return (
    <div className="module-stack">
      <section className="panel">
        <h3>Firma / Cari Yönetimi</h3>
        <form className="inline-form" onSubmit={submit}>
          <label>Cari Kod</label><input required value={form.code} placeholder="C001" onChange={(e)=>setForm({...form,code:e.target.value})} />
          <label>Firma Adı</label><input required value={form.name} placeholder="Firma adı" onChange={(e)=>setForm({...form,name:e.target.value})} />
          <label>Firma Türü</label>
          <select value={form.company_type} onChange={(e)=>setForm({...form,company_type:e.target.value})}>
            <option value="MUSTERI">Müşteri</option><option value="TEDARIKCI">Tedarikçi</option><option value="MUTEAHHIT">Müteahhit</option><option value="TASERON">Taşeron</option><option value="KARMA">Karma</option>
          </select>
          <label>Açılış Bakiyesi</label><input type="number" value={form.opening_balance} onChange={(e)=>setForm({...form,opening_balance:Number(e.target.value)})} />
          <button type="submit">Firma Ekle</button>
        </form>
      </section>
      <section className="panel">
        <div className="row">
          <input placeholder="Cari ara" value={filter} onChange={(e)=>setFilter(e.target.value)} />
          <select value={sort} onChange={(e)=>setSort(e.target.value as any)}><option value="name">Ada göre sırala</option><option value="current_balance">Bakiyeye göre sırala</option></select>
        </div>
        <table>
          <thead><tr><th>Firma</th><th>Tür</th><th>Toplam Alacak</th><th>Toplam Borç</th><th>Vadesi Geçen</th><th>Cari Bakiye</th></tr></thead>
          <tbody>
            {filtered.map((r)=><tr key={r.id} onClick={()=>setSelected(r)} className={selected?.id===r.id?'selected-row':''}><td>{r.name}</td><td>{r.company_type}</td><td>{Number(r.total_income).toFixed(2)}</td><td>{Number(r.total_expense).toFixed(2)}</td><td>{Number(r.overdue_amount||0).toFixed(2)}</td><td>{Number(r.current_balance).toFixed(2)}</td></tr>)}
          </tbody>
          <tfoot><tr><td colSpan={2}><strong>Toplam</strong></td><td>{filtered.reduce((a,b)=>a+Number(b.total_income),0).toFixed(2)}</td><td>{filtered.reduce((a,b)=>a+Number(b.total_expense),0).toFixed(2)}</td><td>{filtered.reduce((a,b)=>a+Number(b.overdue_amount||0),0).toFixed(2)}</td><td>{filtered.reduce((a,b)=>a+Number(b.current_balance),0).toFixed(2)}</td></tr></tfoot>
        </table>
      </section>
      <section className="panel">
        <h3>Seçili Cari Hareketleri</h3>
        <table>
          <thead><tr><th>Tarih</th><th>Tür</th><th>Tutar</th><th>Vade</th><th>Durum</th></tr></thead>
          <tbody>{movements.filter((m)=>selected?m.related_party_id===selected.id:true).map((m)=><tr key={m.id}><td>{m.transaction_date}</td><td>{m.transaction_type}</td><td>{m.amount}</td><td>{m.due_date||'-'}</td><td>{m.status}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
