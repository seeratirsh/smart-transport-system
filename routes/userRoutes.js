const express = require('express');
const router = express.Router();
const connection = require('../config/db');

router.get('/all', (req, res) => {
    connection.query('SELECT id, name, role FROM users', (err, results) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

module.exports = router;