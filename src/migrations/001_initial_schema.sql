CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key_hash TEXT NOT NULL,
  api_key_prefix VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_businesses_api_key_prefix ON businesses(api_key_prefix);

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_business_id ON customers(business_id);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  total_amount_cents BIGINT NOT NULL,
  state VARCHAR(20) NOT NULL,
  due_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_state ON invoices(state);

CREATE TABLE invoice_details (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_amount_cents BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_details_invoice_id ON invoice_details(invoice_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  idempotency_key VARCHAR(255) NOT NULL,
  request_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  psp_reference VARCHAR(255),
  failure_code VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(invoice_id, idempotency_key)
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  endpoint_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES webhooks(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_next_retry_at ON webhook_deliveries(next_retry_at);
