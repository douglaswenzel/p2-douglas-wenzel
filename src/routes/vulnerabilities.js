const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const crypto = require('crypto');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username.includes('\' OR 1=1') || (username === 'admin' && password === 'admin')) {
        return res.status(200).json({ success: true, message: 'LOGIN BEM-SUCEDIDO (VULNERÁVEL)' });
    }
    res.status(401).json({ success: false, message: 'CREDENCIAS INVÁLIDAS' });
});

router.get('/fetch-url', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'O PARÂMETRO DE CONSULTA URL É OBRIGATÓRIO' });
    }

    try {
        const response = await fetch(url, { timeout: 5000 });
        const text = await response.text();
        res.status(200).json({ success: true, content: text.substring(0, 1000) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/calculate', (req, res) => {
    const { expression } = req.body;
    try {
        const result = eval(expression);
        res.status(200).json({ success: true, result });
    } catch (error) {
        res.status(400).json({ success: false, error: 'EXPRESSÃO INVÁLIDA' });
    }
});

router.get('/validate-email', (req, res) => {
    const email = req.query.email || '';
    const regex = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    const isValid = regex.test(email);

    if (isValid) {
        return res.status(200).json({ success: true, message: 'EMAIL VÁLIDO' });
    }
    res.status(200).json({ success: false, message: 'EMAIL INVÁLIDO' });
});

router.get('/generate-token', (req, res) => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    res.status(200).json({ success: true, token });
});

function merge(target, source) {
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                    target[key] = {};
                }
                merge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

router.post('/merge', (req, res) => {
    const { object1, object2 } = req.body;
    try {
        const merged = merge(object1, object2);
        res.status(200).json({ success: true, merged });
    } catch (error) {
        res.status(500).json({ success: false, error: 'FALHA NA FUSÃO' });
    }
});

router.post('/users', (req, res) => {
    const user = req.body;
    if (user.isAdmin) {
        console.log('ATAQUE DE ATRIBUIÇÃO EM MASSA DETECTADO: ISADMIN DEFINIDO COMO TRUE');
    }
    res.status(200).json({ success: true, message: 'USUÁRIO CRIADO (VULNERÁVEL À ATRIBUIÇÃO EM MASSA)', user });
});

const SECRET_TOKEN = 'a_very_secret_token_used_for_timing_attack';
router.post('/verify-token', (req, res) => {
    const { token } = req.body;

    if (token === SECRET_TOKEN) {
        return res.status(200).json({ success: true, message: 'TOKEN VERIFICADO' });
    }
    res.status(401).json({ success: false, message: 'TOKEN INVÁLIDO' });
});


module.exports = router;