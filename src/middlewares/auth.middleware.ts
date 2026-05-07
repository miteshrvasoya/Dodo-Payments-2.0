import { Request, Response, NextFunction } from 'express';
import { query } from '../db/connection';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Missing or invalid Authorization header' });
  }

  console.log("Auth Header: ", authHeader);

  const token = authHeader.split(' ')[1];



  // Fetch Business ID based on the Token passed
  const queryText = "SELECT id FROM businesses WHERE api_key_hash = $1";

  if(token) {
    const business = await query(queryText, [token]);
    console.log("Business: ", business.rows[0]);
    if (business && business.rows.length > 0) {
      (req as any).body.business_id = business.rows[0].id;
      return next();
    }
  }

  // Fallback: Check DB (optional but good for robustness)
  // const business = await query('SELECT id FROM businesses WHERE api_key_hash = $1', [token]);
  // if (business && business.rows.length > 0) { ... }

  return res.status(401).json({ status: 'error', message: 'Unauthorized' });
};
