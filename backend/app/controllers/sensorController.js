const express = require("express");
const router = express.Router();
const { SensorDataModel } = require("../../db");
const {
  getSensorStreamStatus,
  subscribeToSensorStream,
  fetchCurrentSensorSnapshot,
} = require("../services/sensorService");

router.get("/", async (req, res) => {
  try {
    const sensorData = await SensorDataModel.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get by line id
router.get("/line/:id", async (req, res) => {
  try {
    const sensorData = await SensorDataModel.findAll({
      where: { lineId: req.params.id },
    });
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get by machine id
router.get("/machine/:id", async (req, res) => {
  try {
    const sensorData = await SensorDataModel.findAll({
      where: { machineId: req.params.id },
    });
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/status", (req, res) => {
  const status = getSensorStreamStatus();
  const httpStatus = status.isStreaming ? 200 : 503;
  res.status(httpStatus).json({
    server: "ok",
    stream: status,
  });
});

router.get("/stream", async (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  } else if (typeof res.flush === "function") {
    res.flush();
  }

  const writeEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  writeEvent("connected", { message: "Subscribed to sensor stream" });

  const heartbeatInterval = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 15000);

  // Send a warm snapshot so clients instantly see data.
  try {
    const snapshot = await fetchCurrentSensorSnapshot();
    if (snapshot && snapshot.length > 0) {
      writeEvent("snapshot", snapshot);
    }
  } catch (error) {
    writeEvent("error", { message: error.message });
  }

  let unsubscribe;

  try {
    unsubscribe = await subscribeToSensorStream((records) => {
      if (records && records.length > 0) {
        writeEvent("records", records);
      }
    });
  } catch (error) {
    clearInterval(heartbeatInterval);
    writeEvent("error", { message: error.message });
    res.end();
    return;
  }

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    if (unsubscribe) {
      unsubscribe().catch((error) => {
        console.error("Failed to unsubscribe from sensor stream", error);
      });
    }
  });
});

module.exports = router;
