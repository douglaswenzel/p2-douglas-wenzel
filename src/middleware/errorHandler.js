const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    const requestId = req.id || Date.now().toString(36);

    logger.error('ERRO OCORREU', {
        requestId,
        error: {
            message: err.message,
            stack: err.stack,
            name: err.name
        },
        request: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('user-agent')
        }
    });

    const statusCode = err.statusCode || err.status || 500;

    const errorResponse = {
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'ERRO INTERNO DO SERVIDOR'
                : err.message,
            status: statusCode,
            timestamp: new Date().toISOString(),
            requestId
        }
    };

    if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };