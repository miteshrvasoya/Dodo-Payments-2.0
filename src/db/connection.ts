import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const testConnection = async (retries = 10, delayMs = 2000): Promise<void> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info('Successfully connected to the database.');
      return;
    } catch (error: any) {
      logger.warn(`Database connection failed (Attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms...`);
      logger.warn(`Error: `, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};
