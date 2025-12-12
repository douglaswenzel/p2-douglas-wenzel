const morgan = require('morgan');
const logger = require('../config/logger');

morgan.token('body', (req) => {
    if (req.body && req.body.password) {
        return JSON.stringify({ ...req.body, password: '***' });
    }
    return JSON.stringify(req.body);
});

const httpLogFormat = ':method :url :status :response-time ms - :body';

const httpLogger = morgan(httpLogFormat, {
    stream: logger.stream,
    skip: (req) => {
        return process.env.NODE_ENV === 'production' && req.url === '/health';
    }
});

module.exports = httpLogger;
