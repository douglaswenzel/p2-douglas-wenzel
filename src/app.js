const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const app = express();

const corsOptions = {
    origin: 'http://localhost:8080', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORREÇÃO 1: USAR VARIÁVEIS DE AMBIENTE E O NOME DO SERVIÇO 'mysql' ---
const DB_HOST = process.env.DB_HOST || 'mysql'; 
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'password';
const DB_DATABASE = process.env.DB_DATABASE || 'vulnerable_db';

const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE
});

// Lidar com desconexão do DB
db.on('error', (err) => {
    console.error('ERRO FATAL NO BANCO DE DADOS:', err.code);
    // Em um ambiente de produção, aqui deveria haver uma lógica de reconexão.
});
// -------------------------------------------------------------------------


// --- CORREÇÃO 2: ADICIONAR ENDPOINT /HEALTH ---
app.get('/health', (req, res) => {
    // Usa db.ping para verificar a conexão sem fazer uma query completa
    db.ping(err => {
        const dbStatus = err ? 'disconnected' : 'connected';
        const status = dbStatus === 'connected' ? 'healthy' : 'unhealthy';

        if (err) {
            console.error('DB Health Check Failed:', err.message);
        }

        // Retorna 200/healthy ou 503/unhealthy dependendo do status do DB
        res.status(dbStatus === 'connected' ? 200 : 503).json({
            status: status,
            database: dbStatus,
            timestamp: new Date().toISOString()
        });
    });
});
// ---------------------------------------------


app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const query = `SELECT * FROM users WHERE id = ${userId}`;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;

    db.query(query, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, user: result });
    });
});

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

app.get('/fetch-url', (req, res) => {
    const target = req.query.url;
    if (!target) return res.status(400).json({ error: 'PARÂMETRO URL OBRIGATÓRIO' });

    try {
        const parsed = new URL(target);
        const getter = parsed.protocol === 'https:' ? https : http;

        const request = getter.get(parsed, (response) => {
            let data = '';
            response.on('data', (chunk) => (data += chunk));
            response.on('end', () => res.send(data));
        });

        request.on('error', (err) => {
            res.status(500).json({ error: err.message });
        });

        request.setTimeout(4000, () => request.abort());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/calculate', (req, res) => {
    const expression = req.body.expression;
    try {
        const result = eval(expression);
        res.json({ result });
    } catch (err) {
        res.status(400).json({ error: 'EXPRESSÃO INVÁLIDA' });
    }
});

app.get('/validate-email', (req, res) => {
    const email = req.query.email || '';
    const regex = /^([a-zA-Z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;
    res.json({ valid: regex.test(email) });
});

app.get('/generate-token', (req, res) => {
    const token = Math.random().toString(36).substring(2, 12);
    res.json({ token });
});

app.post('/merge', (req, res) => {
    const base = {};
    Object.assign(base, req.body);
    res.json(base);
});

app.post('/users', (req, res) => {
    const user = req.body;
    res.json(user);
});

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