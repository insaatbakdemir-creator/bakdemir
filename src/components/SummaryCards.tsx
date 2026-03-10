import React from 'react';

const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 });

export function SummaryCards({ data }: { data: Record<string, number> }) {
  const items = [
    ['Toplam Tahsil Edilecek Alacak', data.toplam_tahsilat ?? 0],
    ['Toplam Ödenecek Borç', data.toplam_odeme ?? 0],
    ['Taşeronlara Kalan Ödeme', data.total_net ?? 0],
    ['Açık Senet Toplamı', data.open_notes ?? 0],
    ['Gecikmiş Ödemeler', data.gecikmis_odeme ?? 0],
    ['Gecikmiş Tahsilatlar', data.gecikmis_tahsilat ?? 0],
    ['Bu Ay Hakediş', data.hakedis_ay ?? 0],
    ['Bu Ay Taşeron Ödemeleri', data.taseron_odeme_ay ?? 0]
  ];

  return (
    <div className="cards-grid">
      {items.map(([label, value]) => (
        <article key={label} className="card">
          <p>{label}</p>
          <strong>{currency.format(Number(value))}</strong>
        </article>
      ))}
    </div>
  );
}
