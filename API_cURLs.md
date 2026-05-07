# Dodo Payments 2.0 - API cURL Requests

All requests require the following authentication header:
`Authorization: Bearer whsec_acme_secret_123`

---

## 1. Health Check
Checks if the service and database are reachable.

```bash
curl -X GET http://localhost:3000/health \
  -H "Authorization: Bearer whsec_acme_secret_123"
```

---

## 2. Customers

### List Customers
```bash
curl -X GET http://localhost:3000/customers \
  -H "Authorization: Bearer whsec_acme_secret_123"
```

### Create Customer
```bash
curl -X POST http://localhost:3000/customers \
  -H "Authorization: Bearer whsec_acme_secret_123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
```

---

## 3. Invoices

### List All Invoices
```bash
curl -X GET http://localhost:3000/invoices \
  -H "Authorization: Bearer whsec_acme_secret_123"
```

### List Filtered Invoices (e.g., Open)
```bash
curl -X GET "http://localhost:3000/invoices?state=open" \
  -H "Authorization: Bearer whsec_acme_secret_123"
```

### Get Invoice Details
```bash
# Replace <invoice_id> with a real UUID
curl -X GET http://localhost:3000/invoices/<invoice_id> \
  -H "Authorization: Bearer whsec_acme_secret_123"
```

### Create Invoice
Creates an invoice with multiple line items for a customer looked up by email.
```bash
curl -X POST http://localhost:3000/invoices \
  -H "Authorization: Bearer whsec_acme_secret_123" \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "jane@example.com",
    "due_date": "2026-12-31",
    "items": [
      {
        "description": "Premium Subscription",
        "quantity": 1,
        "unit_amount_cents": 5000
      },
      {
        "description": "Setup Fee",
        "quantity": 1,
        "unit_amount_cents": 1000
      }
    ]
  }'
```

### Pay Invoice
Processes a payment using a mock token. Requires an `idempotency-key`.
```bash
# Replace <invoice_id> with a real UUID
# Use tok_success, tok_insufficient_funds, tok_card_declined, tok_timeout, or tok_network_error
curl -X POST http://localhost:3000/invoices/<invoice_id>/pay \
  -H "Authorization: Bearer whsec_acme_secret_123" \
  -H "Content-Type: application/json" \
  -H "idempotency-key: pay_demo_12345" \
  -d '{
    "payment_method": "card",
    "card_number": "tok_success",
    "card_exp": "12/26",
    "card_cvv": "123"
  }'
```
