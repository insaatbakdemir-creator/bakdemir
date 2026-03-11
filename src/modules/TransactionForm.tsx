import React, { useMemo, useState } from 'react';

type Option = { id: number; name: string };

export function TransactionForm({
  projects,
  subcontractors,
  companies,
  personnel,
  onSaved
}: {
  projects: Option[];
  subcontractors: Option[];
  companies: Option[];
  personnel: Array<{ id: number; full_name: string }>;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    transaction_type: 'HAKEDIS',
    flow_direction: 'GELIR',
    related_party_type: 'TASERON',
    related_party_id: 0,
    project_id: 0,
    transaction_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    payment_channel: 'BANKA',
    amount: 0,
    material_deduction_amount: 0,
    equipment_deduction_amount: 0,
    description: ''
  });
  const [message, setMessage] = useState('');

  const partyOptions = useMemo(() => {
    if (form.related_party_type === 'TASERON') return subcontractors;
    if (form.related_party_type === 'FIRMA' || form.related_party_type === 'TEDARIKCI') return companies;
    return personnel.map((p) => ({ id: p.id, name: p.full_name }));
  }, [form.related_party_type, subcontractors, companies, personnel]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      related_party_id: Number(form.related_party_id),
      project_id: Number(form.project_id) || undefined,
      amount: Number(form.amount),
      material_deduction_amount: Number(form.material_deduction_amount),
      equipment_deduction_amount: Number(form.equipment_deduction_amount)
    };
    const res = await window.dobiApi.saveTransaction(payload);
    setMessage(res.ok ? 'Kayıt başarılı.' : 'Doğrulama hatası: tüm kritik alanları kontrol edin.');
    if (res.ok) {
      await onSaved();
    }
  };

  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h3>Hızlı Finans Hareketi</h3>
      <select value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
        <option>HAKEDIS</option><option>YEVMIYE</option><option>AVANS</option><option>ODEME</option>
        <option>KESINTI</option><option>TAHSILAT</option><option>DIGER_GIDER</option><option>DIGER_GELIR</option>
      </select>
      <select value={form.flow_direction} onChange={(e) => setForm({ ...form, flow_direction: e.target.value })}>
        <option>GELIR</option><option>GIDER</option><option>NÖTR</option>
      </select>
      <select value={form.related_party_type} onChange={(e) => setForm({ ...form, related_party_type: e.target.value, related_party_id: 0 })}>
        <option>TASERON</option><option>FIRMA</option><option>PERSONEL</option><option>TEDARIKCI</option>
      </select>

      <select required value={form.related_party_id} onChange={(e) => setForm({ ...form, related_party_id: Number(e.target.value) })}>
        <option value={0}>İlgili kişi/firma seçin</option>
        {partyOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}>
        <option value={0}>Proje seçin (opsiyonel)</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
      <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} placeholder="Vade" />
      <input value={form.payment_channel} onChange={(e) => setForm({ ...form, payment_channel: e.target.value })} placeholder="Kasa/Banka/Senet" />
      <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="Tutar" />
      <input type="number" step="0.01" value={form.material_deduction_amount} onChange={(e) => setForm({ ...form, material_deduction_amount: Number(e.target.value) })} placeholder="Malzeme kesintisi" />
      <input type="number" step="0.01" value={form.equipment_deduction_amount} onChange={(e) => setForm({ ...form, equipment_deduction_amount: Number(e.target.value) })} placeholder="Ekipman kesintisi" />
      <textarea required minLength={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Açıklama" />
      <button type="submit">Kaydet</button>
      {message ? <small>{message}</small> : null}
    </form>
  );
}
