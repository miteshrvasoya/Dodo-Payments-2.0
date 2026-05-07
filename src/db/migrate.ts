import fs from 'fs';
import path from 'path';
import { pool, testConnection } from './connection';
import { logger } from '../utils/logger';

export const runMigrations = async () => {
  await testConnection();
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      logger.warn(`Migrations directory not found at ${migrationsDir}`);
      await client.query('COMMIT');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rowCount } = await client.query('SELECT id FROM migrations WHERE name = $1', [file]);
      if (rowCount === 0) {
        logger.info(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        logger.info(`Migration completed: ${file}`);
      }
    }

    await client.query('COMMIT');
    logger.info('All migrations are up to date.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed', error);
    throw error;
  } finally {
    client.release();
  }
};
