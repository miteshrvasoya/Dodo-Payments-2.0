"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("./logger");
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(`Error on ${req.method} ${req.url}:`, err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
};
exports.errorHandler = errorHandler;
