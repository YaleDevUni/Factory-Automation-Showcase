const dotenv = require("dotenv");
dotenv.config();
const { startSensorStream } = require("./services/sensorService");
const { initDatabase } = require("../../shared_db");

const startServer = async () => {
  try {
    await initDatabase();

    await startSensorStream();
    console.log("OPC UA collector is subscribed and persisting data");
  } catch (error) {
    console.error("Failed to initialize application", error);
    process.exit(1);
  }
};

startServer();
