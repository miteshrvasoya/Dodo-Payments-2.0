import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/connection';
import { WebhookService } from '../services/webhook.service';

const router = Router();

// GET /invoices/:invoiceId
router.get('/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  const result = await query(
    `SELECT i.*, c.name as customer_name, c.email as customer_email, json_agg(d.*) AS details
     FROM invoices i
     JOIN customers c ON i.customer_id = c.id
     LEFT JOIN invoice_details d ON d.invoice_id = i.id
     WHERE i.id = $1
     GROUP BY i.id, c.id`,
    [invoiceId]
  );

  if (!result || result.rows.length === 0) {
    res.status(404).json({ status: 'error', message: 'Invoice not found' });
    return;
  }

  res.status(200).json({ status: 'success', invoice: result.rows[0] });
});

// POST /invoices  — create invoice from customer email + line items
router.post('/', async (req, res) => {
  const { customerEmail, due_date, items } = req.body;

  if (!customerEmail || !due_date || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'customerEmail, due_date, and items[] (with description, quantity, unit_amount_cents) are required',
    });
    return;
  }

  // Validate each line item
  for (const item of items) {
    if (!item.description || !item.quantity || !item.unit_amount_cents) {
      res.status(400).json({ status: 'error', message: 'Each item needs description, quantity, and unit_amount_cents' });
      return;
    }
  }

  // Look up customer by email
  const customerResult = await query('SELECT * FROM customers WHERE email = $1 LIMIT 1', [customerEmail]);
  if (!customerResult || customerResult.rows.length === 0) {
    res.status(404).json({ status: 'error', message: `No customer found with email: ${customerEmail}` });
    return;
  }
  const customer = customerResult.rows[0];

  // Compute total
  const total_amount_cents: number = items.reduce(
    (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_amount_cents),
    0
  );

  // Insert invoice
  const invoice_id = uuidv4();
  const invoiceResult = await query(
    `INSERT INTO invoices (id, business_id, customer_id, total_amount_cents, state, due_date)
     VALUES ($1, $2, $3, $4, 'open', $5) RETURNING *`,
    [invoice_id, customer.business_id, customer.id, total_amount_cents, due_date]
  );

  if (!invoiceResult || invoiceResult.rows.length === 0) {
    res.status(500).json({ status: 'error', message: 'Failed to create invoice' });
    return;
  }

  const invoice = invoiceResult.rows[0];

  // Insert invoice_details
  for (const item of items) {
    await query(
      `INSERT INTO invoice_details (id, invoice_id, description, quantity, unit_amount_cents)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), invoice_id, item.description, Number(item.quantity), Number(item.unit_amount_cents)]
    );
  }

  // Trigger Webhook: invoice.created
  WebhookService.trigger(customer.business_id, 'invoice.created', invoice);

  res.status(201).json({ status: 'success', invoice });
});

// GET /invoices?state=open
router.get('/', async (req, res) => {
  const { state } = req.query;

  let sql = `
    SELECT i.*, c.name as customer_name, c.email as customer_email 
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
  `;
  const params = [];

  if (state) {
    sql += ' WHERE i.state = $1';
    params.push(state);
  }

  sql += ' ORDER BY i.created_at DESC';

  const result = await query(sql, params);

  res.status(200).json({ status: 'success', invoices: result.rows });
});

router.post("/:invoiceId/pay", async (req, res) => {
  const { invoiceId } = req.params;
  const { payment_method, card_number, card_exp, card_cvv } = req.body;
  const idempotency_key = req.headers['idempotency-key'] as string;

  if (!invoiceId || !payment_method || !card_number || !card_exp || !card_cvv) {
    res.status(400).json({ status: 'error', message: 'Missing required payment fields' });
    return;
  }

  if (!idempotency_key) {
    res.status(400).json({ status: 'error', message: 'idempotency-key header is required' });
    return;
  }

  try {
    await query('BEGIN');

    // 1. Check invoice state
    const invoiceResult = await query('SELECT * FROM invoices WHERE id = $1 FOR UPDATE', [invoiceId]);
    if (!invoiceResult || invoiceResult.rows.length === 0) {
      await query('ROLLBACK');
      res.status(404).json({ status: 'error', message: 'Invoice not found' });
      return;
    }

    const invoice = invoiceResult.rows[0];
    if (invoice.state === 'paid') {
      await query('ROLLBACK');
      res.status(200).json({ status: 'success', message: 'Invoice is already paid', invoice });
      return;
    }

    // 2. Check for existing payment (Idempotency)
    const paymentCheck = await query(
      'SELECT * FROM payments WHERE invoice_id = $1 AND idempotency_key = $2',
      [invoiceId, idempotency_key]
    );

    if (paymentCheck && paymentCheck.rows.length > 0) {
      await query('ROLLBACK');
      res.status(200).json({ status: 'success', message: 'Payment already processed', payment: paymentCheck.rows[0] });
      return;
    }

    // Store Payment record with Pending status
    const paymentId = uuidv4();
    const insertPaymentSql = `
      INSERT INTO payments (id, invoice_id, idempotency_key, request_hash, status, psp_reference)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `;
    await query(insertPaymentSql, [
      paymentId,
      invoiceId,
      idempotency_key,
      '', // Simplified hash
      'pending',
      ''  
    ]);

    // 3. Call Mock PSP
    const pspUrl = `http://mock-psp:3001/psp/pay`;
    const pspResponse = await fetch(pspUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: card_number })
    });

    const pspData: any = await pspResponse.json();

    if (pspResponse.status !== 200 || pspData.status !== 'succeeded') {
      // Update Payment record to failed
      await query('UPDATE payments SET status = $1, failure_code = $2 WHERE id = $3', [
        'failed',
        pspData.code || 'psp_error',
        paymentId
      ]);
      
      await query('COMMIT');

      // Trigger Webhook: invoice.payment_failed
      WebhookService.trigger(invoice.business_id, 'invoice.payment_failed', {
        invoice_id: invoiceId,
        payment_id: paymentId,
        error: pspData.code || 'payment_declined'
      });

      res.status(pspResponse.status).json({
        status: 'error',
        message: 'Payment failed at PSP',
        psp_response: pspData
      });
      return;
    }

    // 4. Update Invoice state
    await query("UPDATE invoices SET state = 'paid' WHERE id = $1", [invoiceId]);

    // 5. Update Payment record to success
    const pspReference = pspData.psp_ref || 'REF-' + Date.now();
    const updatePaymentSql = `
      UPDATE payments SET status = $1, psp_reference = $2 WHERE id = $3
    `;
    await query(updatePaymentSql, [
      'success',
      pspReference,
      paymentId,
    ]);

    await query('COMMIT');

    // Trigger Webhook: invoice.paid
    WebhookService.trigger(invoice.business_id, 'invoice.paid', {
      invoice_id: invoiceId,
      payment_id: paymentId,
      reference: pspReference
    });

    res.status(200).json({ status: 'success', invoice: { ...invoice, state: 'paid' } });

  } catch (error: any) {
    await query('ROLLBACK');
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;