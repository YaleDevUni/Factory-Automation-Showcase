const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const sensorRouter = require("./controllers/sensorController");
const { initDatabase } = require("../../shared_db");

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 4000;

app.use("/api/sensor", sensorRouter);

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
