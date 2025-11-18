const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); // Import cors middleware
dotenv.config();

const sensorRouter = require("./controllers/sensorController");
const analyticsRouter = require("./controllers/analyticsController"); // New import
const { initDatabase } = require("../../shared_db");

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 4000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable JSON body parsing

app.use("/api/sensor", sensorRouter);
app.use("/api/analytics", analyticsRouter); // New route

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start API server", error);
    process.exit(1);
  }
};

startServer();
