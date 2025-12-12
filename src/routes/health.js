const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const logger = require('../config/logger');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check da aplicação
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Aplicação saudável
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Tempo de atividade em segundos
 *                 database:
 *                   type: string
 *                   example: connected
 *                 memory:
 *                   type: object
 *       503:
 *         description: Aplicação não saudável
 */
router.get('/health', async (req, res) => {
    const healthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };

    try {
        await pool.query('SELECT 1');
        healthCheck.database = 'connected';
    } catch (error) {
        logger.error('A VERIFICAÇÃO DE INTEGRIDADE DO BANCO DE DADOS FALHOU', { error: error.message });
        healthCheck.database = 'disconnected';
        healthCheck.status = 'unhealthy';
    }

    const memoryUsage = process.memoryUsage();
    healthCheck.memory = {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    };

    const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
});

module.exports = router;
