const express = require("express");
const router = express.Router();
const {
  fetchLatestRecords,
  fetchByLineId,
  fetchByMachineId,
  fetchRecordsAfter,
  getDatabaseHealth,
} = require("../services/sensorDataService");

const toPlainObjects = (records) =>
  records.map((record) => record.get({ plain: true }));

router.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const sensorData = await fetchLatestRecords(limit);
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/line/:id", async (req, res) => {
  try {
    const sensorData = await fetchByLineId(req.params.id);
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/machine/:id", async (req, res) => {
  try {
    const sensorData = await fetchByMachineId(req.params.id);
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const status = await getDatabaseHealth();
    const httpStatus = status.healthy ? 200 : 503;
    res.status(httpStatus).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

  writeEvent("connected", { message: "Subscribed to sensor data feed" });

  let lastSentAt = null;
  try {
    const snapshot = await fetchLatestRecords(20, { ascending: true });
    if (snapshot.length > 0) {
      const plainSnapshot = toPlainObjects(snapshot);
      lastSentAt = plainSnapshot[plainSnapshot.length - 1].createdAt;
      writeEvent("snapshot", plainSnapshot);
    }
  } catch (error) {
    writeEvent("error", { message: error.message });
  }

  const heartbeatInterval = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 15000);

  const pollInterval = setInterval(async () => {
    try {
      const records = await fetchRecordsAfter(lastSentAt);
      if (records.length > 0) {
        const plainRecords = toPlainObjects(records);
        lastSentAt = plainRecords[plainRecords.length - 1].createdAt;
        writeEvent("records", plainRecords);
      }
    } catch (error) {
      writeEvent("error", { message: error.message });
    }
  }, 2000);

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    clearInterval(pollInterval);
    res.end();
  });
});

module.exports = router;
