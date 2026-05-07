"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const health_1 = __importDefault(require("./routes/health"));
const errors_1 = require("./utils/errors");
const migrate_1 = require("./db/migrate");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(health_1.default);
app.use(errors_1.errorHandler);
const startServer = async () => {
    try {
        logger_1.logger.info('Running database migrations...');
        await (0, migrate_1.runMigrations)();
        const server = app.listen(env_1.config.port, () => {
            logger_1.logger.info(`Invoice Service is running on port ${env_1.config.port}`);
        });
        const gracefulShutdown = () => {
            logger_1.logger.info('Shutting down gracefully...');
            server.close(() => {
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
