"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
const logger_1 = require("../utils/logger");
const runMigrations = async () => {
    await (0, connection_1.testConnection)();
    const client = await connection_1.pool.connect();
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
        const migrationsDir = path_1.default.join(__dirname, '../migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            logger_1.logger.warn(`Migrations directory not found at ${migrationsDir}`);
            await client.query('COMMIT');
            return;
        }
        const files = fs_1.default.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
            const { rowCount } = await client.query('SELECT id FROM migrations WHERE name = $1', [file]);
            if (rowCount === 0) {
                logger_1.logger.info(`Running migration: ${file}`);
                const filePath = path_1.default.join(migrationsDir, file);
                const sql = fs_1.default.readFileSync(filePath, 'utf-8');
                await client.query(sql);
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                logger_1.logger.info(`Migration completed: ${file}`);
            }
        }
        await client.query('COMMIT');
        logger_1.logger.info('All migrations are up to date.');
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error('Migration failed', error);
        throw error;
    }
    finally {
        client.release();
    }
};
exports.runMigrations = runMigrations;
