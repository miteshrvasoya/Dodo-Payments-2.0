import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function Dashboard() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [checkedAt, setCheckedAt] = useState<string>('');

  const check = async () => {
    setStatus('loading');
    try {
      const res = await api.health();
      setStatus(res.status === 'ok' ? 'ok' : 'error');
    } catch {
      setStatus('error');
    }
    setCheckedAt(new Date().toLocaleTimeString());
  };

  useEffect(() => { check(); }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">System health and overview</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={check}>↻ Refresh</button>
      </div>

      <div className="card-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Invoice Service</div>
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
            {status === 'loading' && <><span className="spinner" style={{ marginRight: 10 }} /><span style={{ color: 'var(--text-secondary)' }}>Checking…</span></>}
            {status === 'ok' && <><span className="status-dot green" /><span style={{ color: 'var(--success)', fontWeight: 600, fontSize: 16 }}>Operational</span></>}
            {status === 'error' && <><span className="status-dot red" /><span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 16 }}>Unreachable</span></>}
          </div>
          {checkedAt && <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>Last checked at {checkedAt}</p>}
        </div>

        <div className="stat-card">
          <div className="label">API Base URL</div>
          <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 13, color: 'var(--info)' }}>
            http://localhost:3000
          </div>
        </div>

        <div className="stat-card">
          <div className="label">Mock PSP URL</div>
          <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 13, color: 'var(--info)' }}>
            http://localhost:3001
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Available Endpoints</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['GET', '/health', 'Service health check'],
              ['GET', '/customers', 'List all customers'],
              ['POST', '/customers', 'Create a customer'],
              ['GET', '/customers/:id', 'Get customer by ID'],
              ['GET', '/invoices?state=open', 'List open invoices'],
              ['POST', '/invoices', 'Create an invoice'],
              ['GET', '/invoices/:id', 'Get invoice by ID'],
              ['POST', '/psp/pay', 'Simulate a payment (port 3001)'],
            ].map(([method, path, desc]) => (
              <tr key={path}>
                <td>
                  <span className={`badge ${method === 'GET' ? 'badge-info' : 'badge-warning'}`}>{method}</span>
                </td>
                <td className="td-muted">{path}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
