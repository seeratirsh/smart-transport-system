const express = require('express');
const router = express.Router();
const connection = require('../config/db');

// 🔵 ADMIN - View All Bookings
router.get('/', (req, res) => {

    const sql = `
        SELECT bookings.id,
               users.name,
               bookings.destination,
               bookings.date,
               bookings.status
        FROM bookings
        JOIN users ON bookings.faculty_id = users.id
        ORDER BY bookings.id DESC
    `;

    connection.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);

        res.render('admin/bookings', { bookings: results });
    });
});

router.post('/create', (req, res) => {
    const { faculty_id, date, start_time, end_time, destination, purpose } = req.body;

    const sql = `
        INSERT INTO bookings 
        (faculty_id, date, start_time, end_time, destination, purpose)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(sql,
        [faculty_id, date, start_time, end_time, destination, purpose],
        (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }
            res.json({ message: "Booking created successfully!" });
        }
    );
});



// Approve Booking + Auto Assign Bus
router.put('/approve/:id', (req, res) => {

    const bookingId = req.params.id;

    // 1️⃣ Update booking status
    connection.query(
        "UPDATE bookings SET status = 'approved' WHERE id = ?",
        [bookingId],
        (err) => {

            if (err) return res.status(500).json(err);

            // 2️⃣ Find available bus
            connection.query(
                "SELECT id FROM vehicles WHERE status = 'available' LIMIT 1",
                (err, vehicles) => {

                    if (err) return res.status(500).json(err);

                    if (vehicles.length === 0) {
                        return res.json({ message: "No available buses :<" });
                    }

                    const vehicleId = vehicles[0].id;

                    // 3️⃣ Find driver
                    connection.query(
                        "SELECT id FROM users WHERE role = 'driver' LIMIT 1",
                        (err, drivers) => {

                            if (err) return res.status(500).json(err);

                            const driverId = drivers[0].id;

                            // 4️⃣ Create trip
                            connection.query(
                                "INSERT INTO trips (booking_id, vehicle_id, driver_id) VALUES (?, ?, ?)",
                                [bookingId, vehicleId, driverId]
                            );

                            // 5️⃣ Update vehicle status
                            connection.query(
                                "UPDATE vehicles SET status = 'booked' WHERE id = ?",
                                [vehicleId]
                            );

                            res.json({ message: "Booking Approved & Bus Assigned " });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;