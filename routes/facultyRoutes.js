const express = require('express');
const router = express.Router();
const connection = require('../config/db');
const { requireFaculty } = require('./authRoutes');
const PDFDocument = require('pdfkit');

// ==============================
// GET Faculty Booking Page
// ==============================
router.get('/', requireFaculty, (req, res) => {

    res.render('faculty/booking', {
        user: req.session.user   // Pass logged-in faculty
    });
});


// ==============================
// POST New Booking
// ==============================
router.post('/book', requireFaculty, (req, res) => {

    const faculty_id = req.session.user.id;  // ✅ from session
    const { date, start_time, end_time, destination, purpose } = req.body;

    const sql = `
        INSERT INTO bookings 
        (faculty_id, date, start_time, end_time, destination, purpose, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    connection.query(
        sql,
        [faculty_id, date, start_time, end_time, destination, purpose],
        (err) => {
            if (err) return res.status(500).send(err);

            res.redirect('/faculty/history');
        }
    );
});


// ==============================
// GET Faculty History (ONLY THEIR BOOKINGS)
// ==============================
router.get('/history', requireFaculty, (req, res) => {

    const faculty_id = req.session.user.id;

    const sql = `
        SELECT id, destination, date, status
        FROM bookings
        WHERE faculty_id = ?
        ORDER BY id DESC
    `;

    connection.query(sql, [faculty_id], (err, results) => {

        if (err) return res.status(500).send(err);

        res.render('faculty/history', {
            bookings: results
        });
    });
});

router.get('/download/:id', (req, res) => {

    const bookingId = req.params.id;

    const sql = `
        SELECT bookings.*, users.name
        FROM bookings
        JOIN users ON bookings.faculty_id = users.id
        WHERE bookings.id = ?
    `;

    connection.query(sql, [bookingId], (err, results) => {

        if (err) return res.status(500).send(err);

        if (results.length === 0) {
            return res.status(404).send("Booking not found");
        }

        const booking = results[0];

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Booking_${booking.id}.pdf`
        );

        doc.pipe(res);

        // ===== PDF CONTENT =====
        doc.fontSize(20).text('GDGU Transit - Booking Slip', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Booking ID: ${booking.id}`);
        doc.text(`Faculty Name: ${booking.name}`);
        doc.text(`Date: ${booking.date.toDateString()}`);
        doc.text(`Start Time: ${booking.start_time}`);
        doc.text(`End Time: ${booking.end_time}`);
        doc.text(`Destination: ${booking.destination}`);
        doc.text(`Purpose: ${booking.purpose}`);
        doc.text(`Status: ${booking.status}`);

        doc.moveDown();
        doc.text("Thank you for using GDGU Transit.", { align: 'center' });

        doc.end();
    });
});

module.exports = router;