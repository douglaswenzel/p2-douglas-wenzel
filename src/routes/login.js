const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;

    db.get(query, (err, row) => {
        if (err) return res.status(500).send(err.message);
        if (row) return res.status(200).json(row);
        return res.status(401).send('Invalid');
    });
});

module.exports = router;
