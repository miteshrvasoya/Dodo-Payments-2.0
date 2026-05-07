const INVOICE_API = 'http://localhost:3000';
const PSP_API = 'http://localhost:3001';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer whsec_acme_secret_123',
      ...options?.headers
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  health: () => request<{ status: string }>(`${INVOICE_API}/health`),

  customers: {
    list: () =>
      request<{ status: string; customers: any[] }>(`${INVOICE_API}/customers`),
    get: (id: string) =>
      request<{ status: string; customer: any }>(`${INVOICE_API}/customers/${id}`),
    create: (data: { name: string; email: string }) =>
      request<{ status: string; customer: any }>(`${INVOICE_API}/customers`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  invoices: {
    list: (state?: string) =>
      request<{ status: string; invoices?: any[] }>(`${INVOICE_API}/invoices${state ? `?state=${state}` : ''}`),
    get: (id: string) =>
      request<{ status: string; invoice: any }>(`${INVOICE_API}/invoices/${id}`),
    create: (data: { customerEmail: string; due_date: string; items: { description: string; quantity: number; unit_amount_cents: number }[] }) =>
      request<{ status: string; invoice: any }>(`${INVOICE_API}/invoices`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    pay: (id: string, data: { payment_method: string; card_number: string; card_exp: string; card_cvv: string }) =>
      request<{ status: string; invoice: any; payment: any }>(`${INVOICE_API}/invoices/${id}/pay`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'idempotency-key': `pay_${id}_${Date.now()}` // Simple idempotency for demo
        },
        body: JSON.stringify(data),
      }),
  },

  psp: {
    pay: (token: string) =>
      fetch(`${PSP_API}/psp/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).then(async (r) => {
        const data = await r.json();
        return { ...data, httpStatus: r.status };
      }),
  },
};
