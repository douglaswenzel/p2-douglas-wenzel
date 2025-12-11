const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API SAST - Vulnerable Application',
      version: '1.0.0',
      description: 'API com vulnerabilidades intencionais para análise SAST',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://douglaswenzel.onrender.com' 
          : 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST_PROD || process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER_PROD || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME_PROD || process.env.DB_NAME || 'testdb',
      port: process.env.DB_PORT_PROD || process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao PostgreSQL:', res.rows[0]);
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Rota raiz da API
 *     responses:
 *       200:
 *         description: Informações da API
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'API SAST - Aplicação de teste para análise de segurança',
    version: '1.0.0',
    swagger: '/api-docs'
  });
});

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  
  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message, stack: err.stack });
    }
    res.json(results.rows);
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  
  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.rows.length > 0) {
      res.json({ success: true, user: results.rows[0] });
    } else {
      res.status(401).json({ success: false });
    }
  });
});

app.post('/execute', (req, res) => {
  const { command } = req.body;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message, stderr });
    }
    res.json({ output: stdout });
  });
});

app.get('/download', (req, res) => {
  const fileName = req.query.file;
  const filePath = `./uploads/${fileName}`;
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.send(data);
  });
});

app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`<h1>Search results for: ${query}</h1>`);
});

app.post('/encrypt', (req, res) => {
  const { data } = req.body;
  const hash = crypto.createHash('md5').update(data).digest('hex');
  res.json({ encrypted: hash, algorithm: 'DES' });
});

app.get('/fetch-url', (req, res) => {
  const url = req.query.url;
  const request = http.get(url, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => { 
      if (!res.headersSent) {
        res.json({ content: data }); 
      }
    });
  }).on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  });
  
  request.setTimeout(4000, () => {
    request.destroy();
    if (!res.headersSent) {
      res.status(500).json({ error: 'Request timeout' });
    }
  });
});

app.post('/calculate', (req, res) => {
  const { expression } = req.body;
  try {
    const result = eval(expression);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/validate-email', (req, res) => {
  const email = req.query.email;
  const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  const isValid = emailRegex.test(email);
  res.json({ email, valid: isValid });
});

app.get('/generate-token', (req, res) => {
  const token = Math.random().toString(36).substring(2);
  res.json({ token });
});

app.post('/merge', (req, res) => {
  const { target, source } = req.body;
  const merge = (obj1, obj2) => {
    for (let key in obj2) {
      obj1[key] = obj2[key];
    }
    return obj1;
  };
  const result = merge(target || {}, source || {});
  res.json({ result });
});

app.post('/users', (req, res) => {
  const userData = req.body;
  const user = {
    username: userData.username,
    email: userData.email,
    ...userData
  };
  res.json({ ...user, created: true });
});

app.post('/verify-token', (req, res) => {
  const { token } = req.body;
  const validToken = 'secret-token-12345';
  let isValid = token === validToken;
  res.json({ valid: isValid });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    details: err
  });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;