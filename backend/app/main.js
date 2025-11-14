const express = require("express");
const app = express();
const sensorRouter = require("./controllers/sensorController");
const dotenv = require("dotenv");
dotenv.config();
// migrate this logic to opcua simulator later
const { saveSensorData } = require("./services/sensorService");
const { initDatabase } = require("../db");

const PORT = process.env.PORT || 3000;

app.use("/api", sensorRouter);

const startServer = async () => {
  try {
    await initDatabase();

    // mock sensor data every 1 second
    setInterval(() => {
      saveSensorData();
    }, 1000);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize application", error);
    process.exit(1);
  }
};

startServer();
