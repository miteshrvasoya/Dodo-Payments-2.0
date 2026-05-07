import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.customers.list();
      setCustomers(res.customers ?? []);
    } catch (e: any) {
      setError(e.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.customers.create(form);
      setSuccessMsg('Customer created successfully!');
      setForm({ name: '', email: '' });
      setShowCreate(false);
      fetchCustomers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <p className="page-subtitle">Manage your customer records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchCustomers}>↻ Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(v => !v)}>
            {showCreate ? '✕ Cancel' : '+ New Customer'}
          </button>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <div className="create-panel">
          <h3>Create Customer</h3>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="empty"><div className="icon">⏳</div><p>Loading customers…</p></div>
        ) : customers.length === 0 ? (
          <div className="empty"><div className="icon">👥</div><p>No customers yet. Create one above.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>ID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id ?? i}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td className="td-muted">{c.id ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
