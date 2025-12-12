// ./routes/users.js

const express = require('express');
const router = express.Router();
// Tivemos que ajustar a importação para pegar 'db' do seu app.js.
// A forma exata de como 'db' é passado para os routers depende da sua arquitetura.
// Aqui, vamos assumir que 'db' é importado ou injetado.
// PARA SIMPLIFICAR, vamos assumir que o 'db' do app.js pode ser acessado:
const { db, isPostgreSQL } = require('../app'); // **PODE PRECISAR DE AJUSTE DEPENDENDO DA SUA ARQUITETURA**

// Rota POST para criar um novo usuário (POST /api/users)
router.post('/', (req, res) => {
    // 1. Desestruturar os dados do corpo da requisição
    const { 
        nome, 
        sobrenome, 
        tipo, 
        nascimento, // Note que o input é string, o banco trata o tipo (DATE/TIMESTAMP)
        unidade, 
        observacoes, 
        permissao, 
        pasta_id 
    } = req.body;

    // 2. Validação básica (opcional, mas recomendado)
    if (!nome || !sobrenome || !tipo || !nascimento) {
        return res.status(400).json({ error: 'Dados obrigatórios faltando (nome, sobrenome, tipo, nascimento).' });
    }

    // 3. Preparar a query de inserção (usando placeholders para evitar SQL Injection)
    const values = [
        nome, 
        sobrenome, 
        tipo, 
        nascimento, 
        unidade, 
        observacoes, 
        permissao, 
        pasta_id
    ];

    let query;
    if (isPostgreSQL) {
        // PostgreSQL (usando $1, $2, ...)
        query = `
            INSERT INTO users (
                nome, sobrenome, tipo, nascimento, unidade, observacoes, permissao, pasta_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id;
        `;
    } else {
        // MySQL (usando ?)
        query = `
            INSERT INTO users (
                nome, sobrenome, tipo, nascimento, unidade, observacoes, permissao, pasta_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
    }

    // 4. Executar a query no banco de dados
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao inserir usuário:', err.message);
            // Erro 500 para falhas no servidor ou no banco de dados
            return res.status(500).json({ 
                error: 'Erro interno do servidor ao criar usuário',
                details: err.message
            });
        }
        
        let newUserId;
        if (isPostgreSQL) {
            // PostgreSQL retorna o ID no 'rows'
            newUserId = result.rows[0].id;
        } else {
            // MySQL retorna o ID no 'insertId'
            newUserId = result.insertId;
        }

        // 5. Resposta de sucesso (Status 201 Created)
        res.status(201).json({ 
            message: 'Usuário criado com sucesso!', 
            id: newUserId,
            data: { nome, sobrenome } 
        });
    });
});

module.exports = router;