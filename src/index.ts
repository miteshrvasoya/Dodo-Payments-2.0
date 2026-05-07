import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import healthRouter from './routes/health';
import invoicesRouter from './routes/invoices';
import customersRouter from './routes/customers';
import { errorHandler } from './utils/errors';
import { runMigrations } from './db/migrate';

import { authMiddleware } from './middlewares/auth.middleware';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use(healthRouter);

// Protected routes
app.use('/invoices', authMiddleware, invoicesRouter);
app.use('/customers', authMiddleware, customersRouter);
  
app.use(errorHandler);

const startServer = async () => {
  try {
    logger.info('Running database migrations...');
    await runMigrations();
    
    const server = app.listen(config.port, () => {
      logger.info(`Invoice Service is running on port ${config.port}`);
    });

    const gracefulShutdown = () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};


startServer();
