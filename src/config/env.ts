import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  dbUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dodo',
  logLevel: process.env.LOG_LEVEL || 'info',
};
