const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');

const connection = require('./config/db');

const fs = require("fs");

if (process.env.IMPORT_DB === "true") {
  const sql = fs.readFileSync("transport_backup.sql", "utf8");

  connection.query(sql, (err) => {
    if (err) {
      console.error("Import failed:", err);
    } else {
      console.log("Database imported successfully!");
    }
  });
}

// =======================
// ROUTE IMPORTS
// =======================
const { router: authRoutes, requireAdmin, requireFaculty } = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const tripRoutes = require('./routes/tripRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const facultyRoutes = require('./routes/facultyRoutes');

// =======================
// CREATE SERVER + SOCKET
// =======================
const server = http.createServer(app);
const io = socketIo(server);

// Load socket logic
const trackingSocket = require('./sockets/trackingSocket');
trackingSocket(io);

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1);

app.use(session({
    secret: 'gdguSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,      // IMPORTANT for Railway (HTTPS)
        httpOnly: true,
        sameSite: 'none'   // IMPORTANT for production
    }
}));

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// =======================
// ROUTES
// =======================

// Auth routes (login/logout)
app.use('/', authRoutes);

// Admin routes
app.use('/users', requireAdmin, userRoutes);
app.use('/bookings', requireAdmin, bookingRoutes);
app.use('/trips', requireAdmin, tripRoutes);
app.use('/dashboard', requireAdmin, dashboardRoutes);

// Faculty routes
app.use('/faculty', requireFaculty, facultyRoutes);

// =======================
// DEFAULT ROUTE
// =======================
app.get('/', (req, res) => {
    res.redirect('/login');
});



// =======================
// START SERVER
// =======================

app.get("/setup-db", (req, res) => {
  const queries = `

  SET FOREIGN_KEY_CHECKS = 0;

  DROP TABLE IF EXISTS trips;
  DROP TABLE IF EXISTS bookings;
  DROP TABLE IF EXISTS vehicles;
  DROP TABLE IF EXISTS users;

  SET FOREIGN_KEY_CHECKS = 1;

  -- USERS TABLE
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','faculty','driver') NOT NULL
  );

  -- VEHICLES TABLE
  CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_type VARCHAR(50),
    capacity INT,
    status VARCHAR(50) DEFAULT 'available'
  );

  -- BOOKINGS TABLE
  CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    destination VARCHAR(255),
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    vehicle_id INT NULL,
    FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
  );

  -- TRIPS TABLE
  CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    start_time DATETIME,
    end_time DATETIME,
    status VARCHAR(50) DEFAULT 'scheduled',
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  );

  -- INSERT USERS
  INSERT INTO users (name, email, password, role) VALUES
  ('Admin User', 'admin@gdgu.org', '123456', 'admin'),
  ('Dr. Meera', 'meera@gdgu.org', '123456', 'faculty'),
  ('Dr. Ayush', 'ayush@gdgu.org', '123456', 'faculty'),
  ('Mr. Shashi Lal', 'shashi@gdgu.org', '123456', 'driver');

  -- INSERT VEHICLE
  INSERT INTO vehicles (vehicle_number, vehicle_type, capacity, status)
  VALUES ('HR26AB1234', 'Bus', 40, 'available');

  `;

  connection.query(queries, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database setup failed");
    }
    res.send("✅ Full database setup completed successfully!");
  });
});


// app.get("/check-users", (req, res) => {
//   connection.query("SELECT * FROM users", (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.send("Error fetching users");
//     }
//     res.json(results);
//   });
// });

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});