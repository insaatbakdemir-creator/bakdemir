import React from 'react';
import Dashboard from './modules/Dashboard';
import DataModule from './components/DataModule';
import { menuItems, moduleDefs } from './layout/moduleDefs';
import { formatCurrency } from './utils/format';

function Login({ onLogin }) {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('admin123');

  const submit = async () => {
    const res = await window.api.login({ username, password });
    if (!res.ok) return alert(res.message);
    onLogin(res.user);
  };

  return <div className="login"><h1>Santiyem</h1><p>Offline inşaat yönetimi</p><input value={username} onChange={(e)=>setUsername(e.target.value)} /><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} /><button onClick={submit}>Giriş Yap</button></div>;
}

function Reports() {
  const [transactions, setTransactions] = React.useState([]);
  const [payrolls, setPayrolls] = React.useState([]);
  React.useEffect(() => { window.api.list('transactions').then(setTransactions); window.api.list('payrolls').then(setPayrolls); }, []);
  const totalIncome = transactions.filter(t => ['firmadan_tahsilat','diger_gelir'].includes(t.type)).reduce((a,b)=>a+Number(b.amount||0),0);
  const totalExpense = transactions.filter(t => ['firmaya_odeme','diger_odeme'].includes(t.type)).reduce((a,b)=>a+Number(b.amount||0),0);
  const pendingPayroll = payrolls.filter(p => p.payment_status !== 'odendi').reduce((a,b)=>a+Number(b.total_payable||0),0);
  return <div><h2>Raporlar</h2><div className="cards"><div className="card"><small>Genel Finans Özeti</small><strong>{formatCurrency(totalIncome-totalExpense)}</strong></div><div className="card"><small>Bekleyen Maaş Borcu</small><strong>{formatCurrency(pendingPayroll)}</strong></div></div></div>;
}

function Backup() {
  return <div><h2>Yedekleme / Geri Yükleme</h2><button onClick={() => window.api.backupCreate().then((p)=>p && alert(`Yedek alındı: ${p}`))}>Yedek Al</button><button onClick={() => window.api.backupRestore().then((ok)=>ok && alert('Geri yükleme tamamlandı, uygulamayı yeniden başlatın.'))}>Geri Yükle</button></div>;
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [active, setActive] = React.useState('dashboard');

  if (!user) return <Login onLogin={setUser} />;

  const def = moduleDefs[active];
  return (
    <div className="app-shell">
      <aside>
        <h3>Santiyem</h3>
        {menuItems.map((item) => <button key={item} className={item===active?'active':''} onClick={() => setActive(item)}>{moduleDefs[item].title}</button>)}
      </aside>
      <main>
        <header><div>Hoş geldiniz, {user.username} ({user.role})</div><button onClick={() => { window.api.logout(); setUser(null); }}>Çıkış</button></header>
        {active === 'dashboard' && <Dashboard />}
        {active === 'reports' && <Reports />}
        {active === 'backup' && <Backup />}
        {['dashboard','reports','backup'].includes(active) ? null : <DataModule moduleKey={active} title={def.title} fields={def.fields} readOnly={def.readOnly} />}
      </main>
    </div>
  );
}
