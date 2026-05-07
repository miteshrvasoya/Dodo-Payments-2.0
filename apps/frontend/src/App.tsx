import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Invoices } from './pages/Invoices';
import { PspTester } from './pages/PspTester';

type Page = 'dashboard' | 'customers' | 'invoices' | 'psp';

const NAV_ITEMS: { id: Page; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '▣', label: 'Dashboard' },
  { id: 'customers', icon: '👥', label: 'Customers' },
  { id: 'invoices',  icon: '🧾', label: 'Invoices'  },
  { id: 'psp',       icon: '⚡', label: 'PSP Tester' },
];

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'customers': return <Customers />;
      case 'invoices':  return <Invoices />;
      case 'psp':       return <PspTester />;
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🦤 Dodo Payments</h1>
          <span>Admin Dashboard</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
