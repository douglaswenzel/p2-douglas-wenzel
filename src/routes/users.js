const express = require('express');
const router = express.Router();
const { query: dbQuery, pool } = require('../config/database');

/**
 * @swagger
 * components:
 * schemas:
 * User:
 * type: object
 * required:
 * - name
 * - email
 * properties:
 * id:
 * type: integer
 * description: Auto-generated user ID
 * name:
 * type: string
 * description: User name
 * email:
 * type: string
 * description: User email
 * created_at:
 * type: string
 * format: date-time
 * description: Creation timestamp
 */

/**
 * @swagger
 * /api/users:
 * get:
 * summary: Listar todos os usuários
 * tags: [Users]
 * responses:
 * 200:
 * description: Lista de usuários
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/User'
 */
router.get('/', async (req, res) => {
    try {
        const users = await dbQuery('SELECT * FROM users ORDER BY created_at DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('ERRO AO BUSCAR USUÁRIOS:', error);
        res.status(500).json({ success: false, error: 'FALHA AO BUSCAR USUÁRIOS' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 * get:
 * summary: Buscar usuário por ID
 * tags: [Users]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: User ID
 * responses:
 * 200:
 * description: Usuário encontrado
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/User'
 * 404:
 * description: Usuário não encontrado
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const users = await dbQuery('SELECT * FROM users WHERE id = $1', [id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'USUÁRIO NÃO ENCONTRADO' });
        }

        res.json({ success: true, data: users[0] });
    } catch (error) {
        console.error('ERRO AO BUSCAR USUÁRIO:', error);
        res.status(500).json({ success: false, error: 'FALHA AO BUSCAR USUÁRIO' });
    }
});

/**
 * @swagger
 * /api/users:
 * post:
 * summary: Criar novo usuário
 * tags: [Users]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * - email
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * responses:
 * 201:
 * description: Usuário criado com sucesso
 * 400:
 * description: Dados inválidos
 */
router.post('/', async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'NOME E EMAIL SÃO OBRIGATÓRIOS'
            });
        }

        const result = await dbQuery(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );

        res.status(201).json({
            success: true,
            data: result[0]
        });
    } catch (error) {
        console.error('ERRO AO CRIAR USUÁRIO:', error);
        res.status(500).json({ success: false, error: 'FALHA AO CRIAR USUÁRIO' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 * put:
 * summary: Atualizar usuário
 * tags: [Users]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: User ID
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * responses:
 * 200:
 * description: Usuário atualizado com sucesso
 * 404:
 * description: Usuário não encontrado
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        if (!name && !email) {
            return res.status(400).json({
                success: false,
                error: 'PELO MENOS UM CAMPO (NOME OU EMAIL) É OBRIGATÓRIO'
            });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (email) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
            values
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'USUÁRIO NÃO ENCONTRADO' });
        }

        res.json({ success: true, message: 'USUÁRIO ATUALIZADO COM SUCESSO' });
    } catch (error) {
        console.error('ERRO AO ATUALIZAR USUÁRIO:', error);
        res.status(500).json({ success: false, error: 'FALHA AO ATUALIZAR USUÁRIO' });
    }
});

/**
 * @swagger
 * /api/users/{id}:
 * delete:
 * summary: Deletar usuário
 * tags: [Users]
 * parameters:
 * - in: path
 * name: id
 * schema:
 * type: integer
 * required: true
 * description: User ID
 * responses:
 * 200:
 * description: Usuário deletado com sucesso
 * 404:
 * description: Usuário não encontrado
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'USUÁRIO NÃO ENCONTRADO' });
        }

        res.json({ success: true, message: 'USUÁRIO DELETADO COM SUCESSO' });
    } catch (error) {
        console.error('ERRO AO DELETAR USUÁRIO:', error);
        res.status(500).json({ success: false, error: 'FALHA AO DELETAR USUÁRIO' });
    }
});

module.exports = router;