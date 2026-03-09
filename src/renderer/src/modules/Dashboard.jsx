import React from 'react';
import { formatCurrency } from '../utils/format';

export default function Dashboard() {
  const [summary, setSummary] = React.useState(null);
  React.useEffect(() => { window.api.dashboardSummary().then(setSummary); }, []);

  if (!summary) return <div>Yükleniyor...</div>;

  const cards = [
    ['Toplam Alacak', summary.totalReceivable],
    ['Toplam Borç', summary.totalPayable],
    ['Bu Ay Hakediş', summary.monthlyProgress],
    ['Bu Ay Ödemeler', summary.monthlyPayments],
    ['Bu Ay Tahsilatlar', summary.monthlyCollections],
    ['Kasa Bakiye', summary.cashBalance],
    ['Banka Bakiye', summary.bankBalance],
  ];

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="cards">{cards.map(([k,v]) => <div className="card" key={k}><small>{k}</small><strong>{formatCurrency(v)}</strong></div>)}</div>
      <div className="split">
        <div><h3>Yaklaşan / Açık Hatırlatmalar</h3><ul>{summary.pendingReminders.map((r)=><li key={r.id}>{r.title} - {r.due_date || 'Tarihsiz'}</li>)}</ul></div>
        <div><h3>Son Finans Hareketleri</h3><ul>{summary.recentTransactions.map((t)=><li key={t.id}>{t.date} - {t.type} - {formatCurrency(t.amount)}</li>)}</ul></div>
      </div>
    </div>
  );
}
