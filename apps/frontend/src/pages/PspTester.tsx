import { useState } from 'react';
import { api } from '../api/client';

const TOKENS = [
  { id: 'tok_success',           label: 'tok_success',           desc: '→ Success after ~100ms',         color: 'badge-success' },
  { id: 'tok_insufficient_funds', label: 'tok_insufficient_funds', desc: '→ Failed: insufficient_funds',  color: 'badge-danger'  },
  { id: 'tok_card_declined',     label: 'tok_card_declined',     desc: '→ Failed: card_declined',        color: 'badge-danger'  },
  { id: 'tok_timeout',           label: 'tok_timeout',           desc: '→ Success after 30s timeout',   color: 'badge-warning' },
  { id: 'tok_network_error',     label: 'tok_network_error',     desc: '→ HTTP 500 network error',      color: 'badge-danger'  },
];

export function PspTester() {
  const [selected, setSelected] = useState('tok_success');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setResult(null);
    const t0 = Date.now();
    try {
      const res = await api.psp.pay(selected);
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setElapsed(Date.now() - t0);
      setLoading(false);
    }
  };

  const isSuccess = result?.status === 'success';
  const isError   = result?.httpStatus >= 500 || result?.error;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">PSP Tester</h2>
          <p className="page-subtitle">Simulate payment scenarios via the Mock PSP</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Select Card Token</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          Each token triggers a different PSP behaviour
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TOKENS.map(t => (
            <label
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${selected === t.id ? 'var(--accent)' : 'var(--border)'}`,
                background: selected === t.id ? 'var(--accent-bg)' : 'var(--bg-input)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="radio"
                name="token"
                value={t.id}
                checked={selected === t.id}
                onChange={() => setSelected(t.id)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.desc}</span>
              <span className={`badge ${t.color}`} style={{ fontSize: 11 }}>
                {t.id.includes('success') ? 'OK' : t.id.includes('timeout') ? 'SLOW' : t.id.includes('network') ? '500' : 'FAIL'}
              </span>
            </label>
          ))}
        </div>

        <div className="form-actions" style={{ marginTop: 20 }}>
          <button
            className="btn btn-primary"
            onClick={handlePay}
            disabled={loading}
            style={{ minWidth: 140 }}
          >
            {loading
              ? <><span className="spinner" style={{ marginRight: 8 }} />Processing…</>
              : '⚡ Send Payment'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Response</h3>
            {elapsed != null && (
              <span className="badge badge-neutral">{elapsed}ms</span>
            )}
            {isError
              ? <span className="badge badge-danger">Error</span>
              : isSuccess
                ? <span className="badge badge-success">Success</span>
                : <span className="badge badge-warning">Failed</span>}
          </div>
          <div className="code-block">
            {JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
