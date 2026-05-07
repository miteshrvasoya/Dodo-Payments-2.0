"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const query = (text, params) => exports.pool.query(text, params);
exports.query = query;
const testConnection = async (retries = 10, delayMs = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const client = await exports.pool.connect();
            client.release();
            logger_1.logger.info('Successfully connected to the database.');
            return;
        }
        catch (error) {
            logger_1.logger.warn(`Database connection failed (Attempt ${i + 1}/${retries}). Retrying in ${delayMs}ms...`);
            if (i === retries - 1)
                throw error;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
};
exports.testConnection = testConnection;
