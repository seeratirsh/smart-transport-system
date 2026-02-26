const express = require('express');
const router = express.Router();
const connection = require('../config/db');

// 🔵 ADMIN - View All Trips
router.get('/', (req, res) => {

    const sql = `
        SELECT trips.id,
               bookings.destination,
               bookings.date,
               users.name AS driver,
               vehicles.vehicle_number,
               bookings.status
        FROM trips
        JOIN bookings ON trips.booking_id = bookings.id
        JOIN users ON trips.driver_id = users.id
        JOIN vehicles ON trips.vehicle_id = vehicles.id
        ORDER BY trips.id DESC
    `;

    connection.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);

        res.render('admin/trips', { trips: results });
    });
});


// 🔵 ADMIN - Mark Trip as Completed
router.put('/complete/:id', (req, res) => {

    const tripId = req.params.id;

    // 1️⃣ Update booking status
    connection.query(
        `UPDATE bookings 
         JOIN trips ON bookings.id = trips.booking_id
         SET bookings.status = 'completed'
         WHERE trips.id = ?`,
        [tripId],
        (err) => {

            if (err) return res.status(500).json(err);

            // 2️⃣ Make vehicle available again
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