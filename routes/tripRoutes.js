const express = require('express');
const router = express.Router();
const connection = require('../config/db');


// 🔵 ADMIN - View All Trips
router.get('/', (req, res) => {

    const sql = `
        SELECT 
            trips.id,
            bookings.destination,
            bookings.date,
            vehicles.vehicle_number,
            trips.status
        FROM trips
        JOIN bookings ON trips.booking_id = bookings.id
        LEFT JOIN vehicles ON trips.vehicle_id = vehicles.id
        ORDER BY trips.id DESC
    `;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error loading trips");
        }

        res.render('admin/trips', { trips: results });
    });
});


// 🔵 ADMIN - Mark Trip as Completed
router.put('/complete/:id', (req, res) => {

    const tripId = req.params.id;

    // 1️⃣ Update trip status
    connection.query(
        `UPDATE trips SET status = 'completed' WHERE id = ?`,
        [tripId],
        (err) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            // 2️⃣ Update booking status
            connection.query(
                `UPDATE bookings 
                 JOIN trips ON bookings.id = trips.booking_id
                 SET bookings.status = 'completed'
                 WHERE trips.id = ?`,
                [tripId]
            );

            // 3️⃣ Make vehicle available again
            connection.query(
                `UPDATE vehicles 
                 JOIN trips ON vehicles.id = trips.vehicle_id
                 SET vehicles.status = 'available'
                 WHERE trips.id = ?`,
                [tripId]
            );

            res.json({ message: "Trip marked as completed" });
        }
    );
});

module.exports = router;