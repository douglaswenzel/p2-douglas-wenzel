require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || '',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    ssl: process.env.DB_SSL === '' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});


pool.connect((err, client, release) => {
    if (err) {
        console.error('ERRO: FALHA NA CONEXÃO COM O BANCO DE DADOS:', err.message);
        console.log('INFORMAÇÃO: CERTIFIQUE-SE DE CONFIGURAR SEU ARQUIVO .ENV COM AS CREDENCIAIS DO BANCO DE DADOS');
    } else {
        console.log('INFORMAÇÃO: BANCO DE DADOS CONECTADO COM SUCESSO');
        release();
    }
});

const initDatabase = async () => {
    try {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await pool.query(createTableQuery);
        console.log('INFORMAÇÃO: TABELA USERS PRONTA');
    } catch (error) {
        console.error('ERRO: ERRO AO INICIALIZAR O BANCO DE DADOS:', error.message);
    }
};

initDatabase();

const query = async (text, params) => {
    const result = await pool.query(text, params);
    return result.rows;
};

module.exports = {
    query,
    pool
};