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



module.exports = router;
