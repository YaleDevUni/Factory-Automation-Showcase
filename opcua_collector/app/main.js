const dotenv = require("dotenv");
dotenv.config();
const { WebSocketServer } = require("ws");
const {
  startSensorStream,
  subscribeToSensorStream,
} = require("./services/sensorService");
const { initDatabase } = require("../../shared_db");

const startServer = async () => {
  try {
    await initDatabase();

    const wss = new WebSocketServer({ port: 8080 });

    wss.on("connection", (ws) => {
      console.log("Client connected");
      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });

    // Start persisting data to the database
    await startSensorStream();

    // --- Debounce Logic for WebSocket Broadcast ---
    let debounceTimer = null;
    const updatedMachines = new Map();
    const DEBOUNCE_DELAY = 0; // ms

    const broadcastDebounced = () => {
      if (updatedMachines.size === 0) {
        return;
      }
      // The provider now sends the full state, so we just use that
      const records = Array.from(updatedMachines.values());
      const data = JSON.stringify(records);
      for (const client of wss.clients) {
        if (client.readyState === 1) {
          // OPEN
          client.send(data);
        }
      }
      updatedMachines.clear();
    };

    // Broadcast data to WebSocket clients
    await subscribeToSensorStream((records) => {
      if (records && records.length > 0) {
        // The record is an array with a single machine object
        const machine = records[0];
        updatedMachines.set(machine.machine_id, machine);
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => broadcastDebounced(), DEBOUNCE_DELAY);
    });

    console.log(
      "OPC UA collector is running, persisting data, and broadcasting via WebSocket"
    );
  } catch (error) {
    console.error("Failed to initialize application", error);
    process.exit(1);
  }
};

startServer();
