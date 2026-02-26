const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Health check
app.get('/', (req, res) => {
  res.send("SmartBus Backend Running");
});


// 🚍 Register Bus
app.post('/api/bus/register', async (req, res) => {
  const { bus_number, driver_name } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO buses (bus_number, driver_name) VALUES ($1, $2) RETURNING *",
      [bus_number, driver_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📡 GPS Update Endpoint (REAL DEVICE WILL CALL THIS)
app.post('/api/bus/location', async (req, res) => {
  const { bus_id, latitude, longitude, speed } = req.body;

  try {
    await pool.query(
      "INSERT INTO live_locations (bus_id, latitude, longitude, speed) VALUES ($1, $2, $3, $4)",
      [bus_id, latitude, longitude, speed]
    );

    res.json({ message: "Location updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📍 Get Latest Bus Location
app.get('/api/bus/:id/location', async (req, res) => {
  const busId = req.params.id;

  try {
    const result = await pool.query(
      "SELECT * FROM live_locations WHERE bus_id = $1 ORDER BY recorded_at DESC LIMIT 1",
      [busId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});