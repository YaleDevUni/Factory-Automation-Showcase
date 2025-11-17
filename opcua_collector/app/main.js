const express = require("express");
const app = express();
const sensorRouter = require("./controllers/sensorController");
const dotenv = require("dotenv");
dotenv.config();
const { startSensorStream } = require("./services/sensorService");
const { initDatabase } = require("../db");

const PORT = process.env.PORT || 3000;

app.use("/api/sensor", sensorRouter);

const startServer = async () => {
  try {
    await initDatabase();

    await startSensorStream();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize application", error);
    process.exit(1);
  }
};

startServer();
