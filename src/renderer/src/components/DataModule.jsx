import React, { useMemo, useState } from 'react';

export default function DataModule({ moduleKey, title, fields = [], readOnly = false }) {
  const [rows, setRows] = React.useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  const load = React.useCallback(async () => setRows(await window.api.list(moduleKey)), [moduleKey]);
  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    const required = fields.filter((f) => f.required);
    for (const field of required) {
      if (!form[field.key]) return alert(`${field.label} zorunludur.`);
    }
    if (editing) await window.api.update(moduleKey, editing, form);
    else await window.api.create(moduleKey, form);
    setForm({});
    setEditing(null);
    load();
  };

  const filtered = useMemo(() => rows.filter((r) => JSON.stringify(r).toLowerCase().includes(query.toLowerCase())), [rows, query]);

  return (
    <div>
      <div className="section-header"><h2>{title}</h2><div className="actions"><input placeholder="Hızlı ara" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <button onClick={() => window.api.exportExcel(filtered, `${moduleKey}-${Date.now()}`)}>Excel'e Aktar</button></div></div>
      {!readOnly && (
        <div className="form-grid">
          {fields.map((f) => <label key={f.key}>{f.label}<input type={f.type || 'text'} value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} /></label>)}
          <button onClick={save}>{editing ? 'Güncelle' : 'Kaydet'}</button>
        </div>
      )}
      <table>
        <thead><tr>{filtered[0] && Object.keys(filtered[0]).map((k) => <th key={k}>{k}</th>)}{!readOnly && <th>İşlem</th>}</tr></thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              {Object.keys(filtered[0] || {}).map((k) => <td key={k}>{String(row[k] ?? '')}</td>)}
              {!readOnly && <td><button onClick={() => { setForm(row); setEditing(row.id); }}>Düzenle</button><button onClick={() => { if (confirm('Silinsin mi?')) window.api.remove(moduleKey, row.id).then(load); }}>Sil</button></td>}
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={999}>Kayıt bulunamadı.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
