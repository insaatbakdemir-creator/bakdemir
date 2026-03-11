import React from 'react';

const menu = [
  'Dashboard',
  'Firma / Cari Yönetimi',
  'Taşeron Yönetimi',
  'Hakediş + Yevmiye',
  'Avans / Ödeme / Kesinti',
  'Personel',
  'Malzeme',
  'Ekipman / Hizmet',
  'Senet / Vade',
  'Projeler',
  'Raporlama'
];

export function Sidebar({ selected, onSelect }: { selected: string; onSelect: (item: string) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">DOBİ</div>
      <small className="brand-sub">Taşeron Operasyon Yönetimi</small>
      {menu.map((item) => (
        <button key={item} className={`menu-item ${selected === item ? 'active' : ''}`} onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
    </aside>
  );
}
