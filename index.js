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

// Session MUST be before routes
app.use(session({
    secret: 'gdguSecretKey',
    resave: false,
    saveUninitialized: false
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

app.use('/trips', requireAdmin, tripRoutes);

// =======================
// START SERVER
// =======================

app.get("/setup-db", (req, res) => {
  const queries = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      password VARCHAR(255),
      role VARCHAR(20)
    );

    INSERT INTO users (name, email, password, role)
    VALUES 
    ('Admin User', 'admin@gdgu.org', '123456', 'admin'),
    ('Dr. Meera ', 'meera@gdgu.org', '123456', 'faculty'),
    ('Ms. Falak', 'falak@gdgu.org', '123456', 'faculty'),
    ('Mr. Ayush Sharma', 'ayush@gdgu.org', '123456', 'faculty');
  `;

  connection.query(queries, (err) => {
    if (err) {
      console.error(err);
      return res.send("Error creating tables");
    }
    res.send("Database setup complete!");
  });
});


app.get("/check-users", (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error(err);
      return res.send("Error fetching users");
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});