const express = require('express');
const router = express.Router();
const connection = require('../config/db');


// =======================
// SHOW LOGIN PAGE
// =======================
router.get('/login', (req, res) => {
    res.render('login');
});


// =======================
// HANDLE LOGIN
// =======================
router.post('/login', (req, res) => {

    const { email, password } = req.body;

    connection.query(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.status(500).send("Server Error");
            }

            if (results.length === 0) {
                return res.send("Invalid credentials");
            }

            // ✅ Store user in session
            req.session.user = results[0];

            // ✅ Redirect based on role
            if (req.session.user.role === 'admin') {
                return res.redirect('/dashboard');
            }

            if (req.session.user.role === 'faculty') {
                return res.redirect('/faculty');
            }

            if (req.session.user.role === 'driver') {
                return res.redirect('/driver');
            }

            return res.redirect('/login');
        }
    );
});


// =======================
// LOGOUT
// =======================
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});


// =======================
// MIDDLEWARES
// =======================

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
}

function requireFaculty(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'faculty') {
        return res.redirect('/login');
    }
    next();
}

function requireDriver(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'driver') {
        return res.redirect('/login');
    }
    next();
}


module.exports = {
    router,
    requireLogin,
    requireAdmin,
    requireFaculty,
    requireDriver
};