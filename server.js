const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');

const app = express();

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
   BUS REGISTRATION
========================= */
app.post('/api/bus/register', async (req, res) => {
  const { bus_number, driver_name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO buses (bus_number, driver_name)
       VALUES ($1, $2)
       RETURNING *`,
      [bus_number, driver_name]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GPS LOCATION UPDATE
========================= */
app.post('/api/bus/location', async (req, res) => {
  const { bus_id, latitude, longitude, speed } = req.body;

  try {
    await pool.query(
      `INSERT INTO live_locations (bus_id, latitude, longitude, speed)
       VALUES ($1, $2, $3, $4)`,
      [bus_id, latitude, longitude, speed]
    );

    res.json({ message: "Location updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET LATEST BUS LOCATION
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

    if (result.rows.length === 0) {
      return res.json({ message: "No location data found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   CREATE ROUTE
========================= */
app.post('/api/routes', async (req, res) => {
  const { route_name, start_location, end_location } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO routes (route_name, start_location, end_location)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [route_name, start_location, end_location]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ADD STOP TO ROUTE
========================= */
app.post('/api/routes/:routeId/stops', async (req, res) => {
  const routeId = req.params.routeId;
  const { stop_name, latitude, longitude, stop_order } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO stops (route_id, stop_name, latitude, longitude, stop_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [routeId, stop_name, latitude, longitude, stop_order]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ASSIGN BUS TO ROUTE
========================= */
app.post('/api/bus/:id/assign-route', async (req, res) => {
  const busId = req.params.id;
  const { route_id } = req.body;

  try {
    await pool.query(
      `UPDATE buses
       SET route_id = $1
       WHERE id = $2`,
      [route_id, busId]
    );

    res.json({ message: "Bus assigned to route successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ROUTE WITH STOPS
========================= */
app.get('/api/routes/:id', async (req, res) => {
  const routeId = req.params.id;

  try {
    const route = await pool.query(
      `SELECT * FROM routes WHERE id = $1`,
      [routeId]
    );

    if (route.rows.length === 0) {
      return res.json({ message: "Route not found" });
    }

    const stops = await pool.query(
      `SELECT * FROM stops
       WHERE route_id = $1
       ORDER BY stop_order ASC`,
      [routeId]
    );

    res.json({
      route: route.rows[0],
      stops: stops.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ALL BUSES
========================= */
app.get('/api/buses', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM buses`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET ALL ROUTES
========================= */
app.get('/api/routes', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM routes`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});