import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const STATE_COLORS: Record<string, string> = {
  open: 'badge-info',
  paid: 'badge-success',
  draft: 'badge-neutral',
  void: 'badge-danger',
};

export function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ 
    customerEmail: '', 
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_amount_cents: 0 }] 
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState<string>('all');
  
  // Track selected token per invoice
  const [invoiceTokens, setInvoiceTokens] = useState<Record<string, string>>({});

  const TOKENS = [
    { value: 'tok_success', label: 'Success' },
    { value: 'tok_insufficient_funds', label: 'Low Funds' },
    { value: 'tok_card_declined', label: 'Declined' },
    { value: 'tok_timeout', label: 'Timeout' },
    { value: 'tok_network_error', label: 'Network Error' },
  ];

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.invoices.list(filter === 'all' ? undefined : filter);
      const data = res.invoices ?? [];
      setInvoices(data);
      
      // Initialize tokens for new invoices
      setInvoiceTokens(prev => {
        const next = { ...prev };
        data.forEach((inv: any) => {
          if (!next[inv.id]) next[inv.id] = 'tok_success';
        });
        return next;
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.invoices.create(form);
      setSuccessMsg('Invoice created successfully!');
      setForm({ 
        customerEmail: '', 
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unit_amount_cents: 0 }] 
      });
      setShowCreate(false);
      fetchInvoices();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_amount_cents: 0 }] }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      return { ...f, items };
    });
  };

  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const handlePay = async (invoiceId: string) => {
    const token = invoiceTokens[invoiceId] || 'tok_success';
    setSubmitting(true);
    setError('');
    try {
      await api.invoices.pay(invoiceId, {
        payment_method: 'card',
        card_number: token,
        card_exp: '12/26',
        card_cvv: '123'
      });
      setSuccessMsg('Invoice paid successfully!');
      fetchInvoices();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Invoices</h2>
          <div className="filter-tabs">
            {['all', 'open', 'paid', 'void'].map(s => (
              <button 
                key={s} 
                className={`tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchInvoices}>↻ Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(v => !v)}>
            {showCreate ? '✕ Cancel' : '+ New Invoice'}
          </button>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {showCreate && (
        <div className="create-panel">
          <h3>Create Invoice</h3>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={form.customerEmail}
                  onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>Line Items</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateItem(i, 'description', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="Price (cents)"
                      value={item.unit_amount_cents === 0 ? '' : item.unit_amount_cents}
                      onChange={e => updateItem(i, 'unit_amount_cents', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  {form.items.length > 1 && (
                    <button type="button" className="btn btn-secondary" style={{ padding: '9px 12px' }} onClick={() => removeItem(i)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="empty"><div className="icon">⏳</div><p>Loading invoices…</p></div>
        ) : invoices.length === 0 ? (
          <div className="empty"><div className="icon">🧾</div><p>No invoices found.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID / Customer</th>
                <th>State</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Payment Logic (Mock)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id ?? i}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.id?.slice(0, 8)}...</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {inv.customer_name} ({inv.customer_email})
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${STATE_COLORS[inv.state] ?? 'badge-neutral'}`}>
                      {inv.state ?? 'unknown'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ${inv.total_amount_cents != null ? (inv.total_amount_cents / 100).toFixed(2) : '0.00'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {inv.state === 'open' && (
                      <select 
                        className="btn btn-secondary btn-sm" 
                        style={{ background: 'var(--bg-input)', fontSize: 11 }}
                        value={invoiceTokens[inv.id] || 'tok_success'}
                        onChange={e => setInvoiceTokens(prev => ({ ...prev, [inv.id]: e.target.value }))}
                      >
                        {TOKENS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    )}
                  </td>
                  <td>
                    {inv.state === 'open' && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handlePay(inv.id)}
                        disabled={submitting}
                      >
                        Pay
                      </button>
                    )}
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
