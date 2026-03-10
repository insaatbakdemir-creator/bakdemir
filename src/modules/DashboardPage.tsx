import React from 'react';
import { SummaryCards } from '../components/SummaryCards';

export function DashboardPage({ dashboard, recent }: { dashboard: Record<string, number>; recent: any[] }) {
  return (
    <>
      <SummaryCards data={dashboard} />
      <section className="panel" style={{ marginTop: 14 }}>
        <h3>Son Hareketler</h3>
        <table>
          <thead><tr><th>Tarih</th><th>Tür</th><th>Tutar</th><th>Açıklama</th><th>Durum</th></tr></thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>{r.transaction_date}</td>
                <td>{r.transaction_type}</td>
                <td>{r.amount}</td>
                <td>{r.description}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
