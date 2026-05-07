import { Router } from 'express';
import { query } from '../db/connection';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/:customerId', async (req, res) => {
    const { customerId } = req.params;

    if (!customerId) {
        res.status(400).json({ status: 'error', message: 'Invalid customerId parameter' });
        return;
    }

    const sql = `SELECT * FROM customers WHERE id = $1`;

    const result: any = await query(sql, [customerId]);

    if (!result || result.rows.length === 0) {
        res.status(404).json({ status: 'error', message: 'Customer not found' });
        return;
    }

    res.status(200).json({ status: 'success', customer: result.rows[0] });
});

router.post("/", async (req, res) => {
    const { email, name } = req.body;

    if (!email || !name) {
        res.status(400).json({ status: 'error', message: 'Email and name are required' });
        return;
    }

    const customer_id = uuidv4();

    const business_id = req.body.business_id;

    console.log("Business ID", business_id);

    const sql = `INSERT INTO customers (id, business_id, email, name) VALUES ($1, $2, $3, $4) RETURNING *`;

    const result: any = await query(sql, [customer_id, business_id, email, name]);

    if (!result || result.rows.length === 0) {
        res.status(500).json({ status: 'error', message: 'Failed to create customer' });
        return;
    }

    res.status(200).json({ status: 'success', customer: result.rows[0] });
});

router.get("/", async (req, res) => {
    const sql = `SELECT * FROM customers ORDER BY created_at DESC`;

    const result: any = await query(sql);

    if (!result) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch customers' });
        return;
    }

    res.status(200).json({ status: 'success', customers: result.rows });
})

export default router;
