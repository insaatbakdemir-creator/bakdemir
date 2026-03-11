import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './modules/DashboardPage';
import { CompaniesPage } from './modules/CompaniesPage';
import { SubcontractorsPage } from './modules/SubcontractorsPage';
import { ProjectsPage } from './modules/ProjectsPage';
import { HakedisYevmiyePage } from './modules/HakedisYevmiyePage';
import { AvansOdemeKesintiPage } from './modules/AvansOdemeKesintiPage';
import { ModuleEntriesPage } from './modules/ModuleEntriesPage';

export function App() {
  const [selected, setSelected] = useState('Dashboard');
  const [meta, setMeta] = useState<any>(null);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [subcontractorMgmt, setSubcontractorMgmt] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyBalances, setCompanyBalances] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  const refresh = async () => {
    const [d, p, s, sm, c, cb, pe, r] = await Promise.all([
      window.dobiApi.dashboard(),
      window.dobiApi.listProjects(),
      window.dobiApi.listSubcontractors(),
      window.dobiApi.listSubcontractorManagement(),
      window.dobiApi.listCompanies(),
      window.dobiApi.listCompanyBalances(),
      window.dobiApi.listPersonnel(),
      window.dobiApi.recentTransactions()
    ]);
    setDashboard(d);
    setProjects(p);
    setSubcontractors(s);
    setSubcontractorMgmt(sm);
    setCompanies(c);
    setCompanyBalances(cb);
    setPersonnel(pe);
    setRecent(r);
  };

  useEffect(() => {
    window.dobiApi.getMeta().then(setMeta);
    refresh();
  }, []);

  const renderContent = () => {
    if (selected === 'Dashboard') return <DashboardPage dashboard={dashboard} recent={recent} />;
    if (selected === 'Firma / Cari Yönetimi') return <CompaniesPage rows={companyBalances} movements={recent} onRefresh={refresh} />;
    if (selected === 'Taşeron Yönetimi') return <SubcontractorsPage rows={subcontractorMgmt} onRefresh={refresh} />;
    if (selected === 'Hakediş + Yevmiye') return <HakedisYevmiyePage companies={companies} subcontractors={subcontractors} personnel={personnel} projects={projects} onSaved={refresh} />;
    if (selected === 'Avans / Ödeme / Kesinti') return <AvansOdemeKesintiPage companies={companies} subcontractors={subcontractors} personnel={personnel} projects={projects} onSaved={refresh} />;
    if (selected === 'Projeler') return <ProjectsPage projects={projects} companies={companies} subcontractors={subcontractors} onRefresh={refresh} />;
    if (selected === 'Personel') return <ModuleEntriesPage moduleKey="personel" title="Personel Hareketleri" companies={companies} subcontractors={subcontractors} projects={projects} />;
    if (selected === 'Malzeme') return <ModuleEntriesPage moduleKey="malzeme" title="Malzeme Hareketleri" companies={companies} subcontractors={subcontractors} projects={projects} />;
    if (selected === 'Ekipman / Hizmet') return <ModuleEntriesPage moduleKey="ekipman_hizmet" title="Ekipman / Hizmet" companies={companies} subcontractors={subcontractors} projects={projects} />;
    if (selected === 'Senet / Vade') return <ModuleEntriesPage moduleKey="senet_vade" title="Senet / Vade" companies={companies} subcontractors={subcontractors} projects={projects} />;
    if (selected === 'Raporlama') return <ModuleEntriesPage moduleKey="raporlama" title="Raporlama" companies={companies} subcontractors={subcontractors} projects={projects} />;
    return <section className="panel">Modül bulunamadı.</section>;
  };

  return (
    <main className="layout">
      <Sidebar selected={selected} onSelect={setSelected} />
      <section className="content">
        <header className="topbar">
          <h1>{selected}</h1>
          <div><span>{meta?.appName} v{meta?.version}</span><small>Geliştirici: {meta?.developer} | Tamamen Offline</small></div>
        </header>
        {renderContent()}
      </section>
    </main>
  );
}
