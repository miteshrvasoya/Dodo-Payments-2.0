-- Sample Business: Acme Corp
INSERT INTO businesses (id, name, api_key_hash, api_key_prefix, created_at)
VALUES (
  '6558fd07-20d6-4e0f-9b3d-65491f3ace37', 
  'Acme Corp', 
  'whsec_acme_secret_123', 
  'acme_key_', 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Sample Webhook for Acme Corp
INSERT INTO webhooks (id, business_id, endpoint_url, secret, created_at)
VALUES (
  '0d5d1ac9-07f7-44be-85fc-a729b1bfdbd3', 
  '6558fd07-20d6-4e0f-9b3d-65491f3ace37', 
  'https://webhook.site/sample-endpoint', 
  'whsec_acme_secret_123', 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Sample Webhook Delivery
INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, status, retry_count, next_retry_at, created_at)
VALUES (
  'd44ebcc9-211f-4345-9fb4-d598c47afc8e',
  '0d5d1ac9-07f7-44be-85fc-a729b1bfdbd3',
  'invoice.created',
  '{"invoice_id": "inv_123", "amount": 1000}',
  'success',
  0,
  NULL,
  NOW()
) ON CONFLICT (id) DO NOTHING;
