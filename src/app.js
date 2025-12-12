const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const { Pool } = require('pg');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url'); // Importar URL

const app = express();

// ----------------------------------------------------
// IMPORTS DE ROTAS MODULARIZADAS
// Assumindo que os arquivos de rota estão em ./routes
// users.js usa o prefixo /api/users
const usersRouter = require('./routes/users');
// vulnerabilities.js contém rotas de exemplo de vulnerabilidades
const vulnerabilitiesRouter = require('./routes/vulnerabilities');
// health.js é o router de health check
const healthRouter = require('./routes/health');
// ----------------------------------------------------

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let db;
let dbPing;
let isPostgreSQL = false;

if (process.env.DATABASE_URL) {
    // Conexão PostgreSQL para Render
    isPostgreSQL = true;
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    // Exporta o pool para ser usado pelos routers (como users.js)
    db = pool; 
    dbPing = (callback) => {
        pool.query('SELECT 1', (err, res) => callback(err));
    };

} else {
    // Conexão MySQL para Local/Docker Compose
    const DB_HOST = process.env.DB_HOST || 'mysql';
    const DB_USER = process.env.DB_USER || 'root';
    const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
    const DB_DATABASE = process.env.DB_DATABASE || 'vulnerable_db';

    db = mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_DATABASE
    });
    dbPing = db.ping.bind(db);
    
    db.on('error', (err) => {
        console.error('ERRO FATAL NO BANCO DE DADOS (MYSQL):', err.code);
    });
}

// Rota de Usuários Segura (users.js)
// Accessível em: /api/users
app.use('/api/users', usersRouter);

// Rota de Health Check (health.js)
// Accessível em: /api/health (ou ajuste o prefixo se preferir)
// Eu montei em /health para manter o path simples: /health
app.use('/health', healthRouter); 

// Rotas de Vulnerabilidades/Exemplo (vulnerabilities.js)
// Accessível em: /vulnerabilities/login, /vulnerabilities/fetch-url, etc.
app.use('/vulnerabilities', vulnerabilitiesRouter); 


// ----------------------------------------------------
// ROTAS VULNERÁVEIS DE EXEMPLO (MANTIDAS EM-LINHA OU RENOMEADAS)
// Estas são as rotas não resolvidas pelos routers importados acima
// ----------------------------------------------------

// 🚨 REMOVENDO ROTAS REDUNDANTES:
// As rotas /users/:id, /login, /post, /calculate, /fetch-url, etc. foram removidas daqui
// pois agora são tratadas pelos routers.

app.post('/execute', (req, res) => {
    const command = req.body.command || '';
    exec(`ls ${command}`, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ output: stdout });
    });
});

app.get('/download', (req, res) => {
    const filename = req.query.file || '';
    const filepath = path.join(__dirname, filename);

    fs.stat(filepath, (err, stat) => {
        if (err) {
            return res.status(404).json({ error: 'ARQUIVO NÃO ENCONTRADO' });
        }
        res.sendFile(filepath, (sendErr) => {
            if (sendErr) {
                res.status(500).json({ error: sendErr.message });
            }
        });
    });
});

app.get('/search', (req, res) => {
    const searchTerm = req.query.q || '';
    const html = `
        <html>
          <body>
            <h1>RESULTADOS PARA: ${searchTerm}</h1>
          </body>
        </html>
    `;
    res.set('Content-Type', 'text/html');
    res.send(html);
});

app.post('/encrypt', (req, res) => {
    const data = req.body.data || '';
    const weakKey = 'weak-key-12345';
    const encrypted = crypto.createHash('md5').update(data + weakKey).digest('hex');
    res.json({ encrypted, algorithm: 'md5', key: weakKey });
});

// A rota /verify-token em app.js é vulnerável a Timing Attack
app.post('/verify-token', (req, res) => {
    const token = req.body.token || '';
    const realToken = 'super-secret-token-12345';
    let valid = true;

    for (let i = 0; i < realToken.length; i++) {
        if (token[i] !== realToken[i]) {
            valid = false;
            break;
        }
    }

    res.json({ valid });
});

app.use((req, res) => {
    res.status(404).json({ error: 'NÃO ENCONTRADO' });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`SERVIDOR EXECUTANDO NA PORTA ${PORT}`);
    });
}