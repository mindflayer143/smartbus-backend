const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

/* =============================
   HEALTH CHECK
============================= */
app.get('/', (req, res) => {
  res.send("SmartBus Backend Running");
});

/* =============================
   AUTO BUS SIMULATION
   (No curl needed)
============================= */

const routeCoordinates = [
  { lat: 13.0827, lng: 80.2707 },
  { lat: 13.0805, lng: 80.2690 },
  { lat: 13.0780, lng: 80.2680 },
  { lat: 13.0755, lng: 80.2675 },
  { lat: 13.0720, lng: 80.2685 },
  { lat: 13.0690, lng: 80.2700 },
  { lat: 13.0655, lng: 80.2720 },
  { lat: 13.0620, lng: 80.2740 },
  { lat: 13.0585, lng: 80.2760 }
];

let currentIndex = 0;

function simulateBus() {
  const point = routeCoordinates[currentIndex];

  io.emit("busLocationUpdate", {
    bus_id: 1,
    latitude: point.lat,
    longitude: point.lng,
    speed: 35
  });

  currentIndex++;

  if (currentIndex >= routeCoordinates.length) {
    currentIndex = 0; // loop back
  }
}

// Run every 3 seconds
setInterval(simulateBus, 3000);

/* =============================
   SOCKET CONNECTION
============================= */
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

/* =============================
   START SERVER
============================= */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});