import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { TransactionForm } from './modules/TransactionForm';
import { ReportsPanel } from './modules/ReportsPanel';

export function App() {
  const [selected, setSelected] = useState('Dashboard');
  const [meta, setMeta] = useState<any>(null);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  const refresh = async () => {
    const [d, p, s, c, pe, r] = await Promise.all([
      window.dobiApi.dashboard(),
      window.dobiApi.listProjects(),
      window.dobiApi.listSubcontractors(),
      window.dobiApi.listCompanies(),
      window.dobiApi.listPersonnel(),
      window.dobiApi.recentTransactions()
    ]);
    setDashboard(d);
    setProjects(p);
    setSubcontractors(s);
    setCompanies(c);
    setPersonnel(pe);
    setRecent(r);
  };

  useEffect(() => {
    window.dobiApi.getMeta().then(setMeta);
    refresh();
  }, []);

  return (
    <main className="layout">
      <Sidebar selected={selected} onSelect={setSelected} />
      <section className="content">
        <header className="topbar">
          <h1>{selected}</h1>
          <div>
            <span>{meta?.appName} v{meta?.version}</span>
            <small>Geliştirici: {meta?.developer} | Tamamen Offline</small>
          </div>
        </header>

        <SummaryCards data={dashboard} />

        <div className="split">
          <TransactionForm
            projects={projects}
            subcontractors={subcontractors}
            companies={companies}
            personnel={personnel}
            onSaved={refresh}
          />

          <section className="panel">
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
                    <td className={r.due_date && r.due_date < new Date().toISOString().slice(0, 10) ? 'danger' : ''}>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <ReportsPanel subcontractors={subcontractors} />
      </section>
    </main>
  );
}
