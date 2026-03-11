import React, { useMemo, useState } from 'react';

type Option = { id: number; name?: string; full_name?: string };

type Props = {
  title: string;
  type: 'HAKEDIS' | 'YEVMIYE' | 'ODEME' | 'AVANS' | 'KESINTI' | 'TAHSILAT';
  flow: 'GELIR' | 'GIDER';
  companies: Option[];
  subcontractors: Option[];
  personnel: Option[];
  projects: Option[];
  onSaved: () => Promise<void>;
};

const relatedTypeOptions = [
  { value: 'TASERON', label: 'Taşeron' },
  { value: 'FIRMA', label: 'Firma' },
  { value: 'PERSONEL', label: 'Personel' }
];

export function OperationForm({ title, type, flow, companies, subcontractors, personnel, projects, onSaved }: Props) {
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
    description: ''
  });
  const [error, setError] = useState('');

  const partyOptions = useMemo(() => {
    if (form.related_party_type === 'FIRMA') return companies.map((c) => ({ id: c.id, label: c.name ?? '' }));
    if (form.related_party_type === 'PERSONEL') return personnel.map((p) => ({ id: p.id, label: p.full_name ?? p.name ?? '' }));
    return subcontractors.map((s) => ({ id: s.id, label: s.name ?? '' }));
  }, [form.related_party_type, companies, personnel, subcontractors]);

  const projectOptions = useMemo(() => projects.map((p) => ({ id: p.id, label: p.name ?? '' })), [projects]);

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
    if (!res.ok) return setError('Kayıt başarısız, alanları kontrol edin.');

    await onSaved();
    setForm({
      ...form,
      related_party_id: 0,
      project_id: 0,
      amount: 0,
      material_deduction_amount: 0,
      equipment_deduction_amount: 0,
      description: ''
    });
  };

  return (
    <form className="panel labeled-form" onSubmit={submit}>
      <h3>{title}</h3>

      <label>İlgili Tür</label>
      <select value={form.related_party_type} onChange={(e) => setForm({ ...form, related_party_type: e.target.value, related_party_id: 0 })}>
        {relatedTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <label>İlgili Kayıt</label>
      <select value={form.related_party_id} onChange={(e) => setForm({ ...form, related_party_id: Number(e.target.value) })}>
        {partyOptions.length === 0 ? <option value={0}>Önce {form.related_party_type === 'FIRMA' ? 'firma' : form.related_party_type === 'PERSONEL' ? 'personel' : 'taşeron'} ekleyin</option> : <option value={0}>Seçiniz</option>}
        {partyOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>

      <label>Proje</label>
      <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}>
        {projectOptions.length === 0 ? <option value={0}>Önce proje ekleyin</option> : <option value={0}>Seçiniz (opsiyonel)</option>}
        {projectOptions.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      <label>Tarih</label>
      <input type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />

      <label>Vade Tarihi</label>
      <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />

      <label>Ödeme Yöntemi</label>
      <input placeholder="Banka / Kasa / Senet" value={form.payment_channel} onChange={(e) => setForm({ ...form, payment_channel: e.target.value })} />

      <label>Tutar</label>
      <input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />

      <label>Açıklama</label>
      <textarea placeholder="İşlem açıklaması" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <button type="submit">Kaydet</button>
      {error ? <small className="danger">{error}</small> : null}
    </form>
  );
}
