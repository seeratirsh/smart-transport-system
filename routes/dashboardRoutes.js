const express = require('express');
const router = express.Router();
const connection = require('../config/db');

router.get('/', (req, res) => {

    const stats = {};

    connection.query("SELECT COUNT(*) AS total_bookings FROM bookings", (err, r1) => {
        stats.total_bookings = r1[0].total_bookings;

        connection.query("SELECT COUNT(*) AS active_trips FROM trips WHERE trip_status='active'", (err, r2) => {
            stats.active_trips = r2[0].active_trips;

            connection.query("SELECT COUNT(*) AS available_buses FROM vehicles WHERE status='available'", (err, r3) => {
                stats.available_buses = r3[0].available_buses;

                connection.query("SELECT COUNT(*) AS pending_bookings FROM bookings WHERE status='pending'", (err, r4) => {
                    stats.pending_bookings = r4[0].pending_bookings;

                    // 📊 Status Breakdown
                    connection.query(`
                        SELECT status, COUNT(*) AS count 
                        FROM bookings 
                        GROUP BY status
                    `, (err, statusData) => {

                        // 📊 Monthly Trend
                        connection.query(`
                            SELECT MONTH(date) AS month, COUNT(*) AS count
                            FROM bookings
                            GROUP BY MONTH(date)
                            ORDER BY MONTH(date)
                        `, (err, monthlyData) => {

                            res.render('admin/dashboard', {
                                stats,
                                statusData,
                                monthlyData
                            });

                        });

                    });

                });
            });
        });
    });
});

router.get('/bookings', (req, res) => {

    const sql = `
        SELECT bookings.id, users.name, bookings.destination,
               bookings.date, bookings.status
        FROM bookings
        JOIN users ON bookings.faculty_id = users.id
        ORDER BY bookings.id DESC
    `;

    connection.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);

        res.render('admin/bookings', { bookings: results });
    });
});

module.exports = router;