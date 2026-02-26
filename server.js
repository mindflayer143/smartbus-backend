const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

/* =========================
   HEALTH CHECK
========================= */
app.get('/', (req, res) => {
  res.send("SmartBus Backend Running");
});

/* =========================
   REGISTER BUS
========================= */
app.post('/api/bus/register', async (req, res) => {
  const { bus_number, driver_name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO buses (bus_number, driver_name)
       VALUES ($1, $2) RETURNING *`,
      [bus_number, driver_name]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GPS UPDATE
========================= */
app.post('/api/bus/location', async (req, res) => {
  const { bus_id, latitude, longitude, speed } = req.body;

  try {
    await pool.query(
      `INSERT INTO live_locations (bus_id, latitude, longitude, speed)
       VALUES ($1, $2, $3, $4)`,
      [bus_id, latitude, longitude, speed]
    );

    io.emit("busLocationUpdate", {
      bus_id,
      latitude,
      longitude,
      speed
    });

    res.json({ message: "Location updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET LATEST LOCATION
========================= */
app.get('/api/bus/:id/location', async (req, res) => {
  const busId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT * FROM live_locations
       WHERE bus_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [busId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   WEBSOCKET
========================= */
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

/* =========================
   START SERVER
========================= */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});