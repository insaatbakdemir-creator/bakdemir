import React, { useState } from 'react';

type Option = { id: number; name: string };

type Props = {
  title: string;
  type: 'HAKEDIS' | 'YEVMIYE' | 'ODEME' | 'AVANS' | 'KESINTI' | 'TAHSILAT';
  flow: 'GELIR' | 'GIDER';
  companies: Option[];
  subcontractors: Option[];
  projects: Option[];
  onSaved: () => Promise<void>;
};

const statusOptions: Record<Props['type'], string[]> = {
  HAKEDIS: ['TASLAK', 'ONAYLANDI', 'KISMI_ODENDI', 'ODENDI', 'IPTAL'],
  YEVMIYE: ['TASLAK', 'ONAYLANDI', 'KISMI_ODENDI', 'ODENDI', 'IPTAL'],
  ODEME: ['TAMAMLANDI', 'BEKLEMEDE', 'IPTAL'],
  AVANS: ['TAMAMLANDI', 'BEKLEMEDE', 'IPTAL'],
  KESINTI: ['TAMAMLANDI', 'BEKLEMEDE', 'IPTAL'],
  TAHSILAT: ['TAMAMLANDI', 'BEKLEMEDE', 'IPTAL']
};

export function OperationForm({ title, type, flow, companies, subcontractors, projects, onSaved }: Props) {
  const [form, setForm] = useState({
    related_party_type: type === 'TAHSILAT' ? 'FIRMA' : 'TASERON',
    related_party_id: 0,
    project_id: 0,
    transaction_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    payment_channel: 'BANKA',
    amount: 0,
    material_deduction_amount: 0,
    equipment_deduction_amount: 0,
    status: statusOptions[type][0],
    description: ''
  });
  const [error, setError] = useState('');

  const partyOptions = form.related_party_type === 'FIRMA' ? companies : subcontractors;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.related_party_id) return setError('İlgili kayıt seçimi zorunludur.');
    if (Number(form.amount) <= 0) return setError('Tutar sıfırdan büyük olmalıdır.');
    if (!form.description.trim()) return setError('Açıklama zorunludur.');
    const payload = {
      transaction_type: type,
      flow_direction: flow,
      ...form,
      related_party_id: Number(form.related_party_id),
      project_id: Number(form.project_id) || undefined,
      amount: Number(form.amount),
      material_deduction_amount: Number(form.material_deduction_amount),
      equipment_deduction_amount: Number(form.equipment_deduction_amount)
    };
    const res = await window.dobiApi.saveTransaction(payload);
    if (!res.ok) return setError(res.message ?? 'Kayıt başarısız.');
    await onSaved();
    setForm({ ...form, amount: 0, description: '' });
  };

  return (
    <form className="panel labeled-form" onSubmit={submit}>
      <h3>{title}</h3>
      <label>İlgili Tür</label>
      <select value={form.related_party_type} onChange={(e) => setForm({ ...form, related_party_type: e.target.value, related_party_id: 0 })}>
        <option value="TASERON">Taşeron</option>
        <option value="FIRMA">Firma</option>
      </select>

      <label>İlgili Kayıt</label>
      <select value={form.related_party_id} onChange={(e) => setForm({ ...form, related_party_id: Number(e.target.value) })}>
        <option value={0}>Seçiniz</option>
        {partyOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>

      <label>Proje</label>
      <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}>
        <option value={0}>Opsiyonel</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>

      <label>Tarih</label>
      <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />

      <label>Vade Tarihi</label>
      <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />

      <label>Ödeme Yöntemi</label>
      <input placeholder="Banka/Kasa/Senet" value={form.payment_channel} onChange={(e) => setForm({ ...form, payment_channel: e.target.value })} />

      <label>Tutar</label>
      <input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />

      <label>Durum</label>
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        {statusOptions[type].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Açıklama</label>
      <textarea placeholder="İşlem açıklaması" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <button type="submit">Kaydet</button>
      {error ? <small className="danger">{error}</small> : null}
    </form>
  );
}
