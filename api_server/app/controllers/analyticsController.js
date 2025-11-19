const express = require("express");
const router = express.Router();
const {
  fetchPropertyHistory,
  fetchOverviewAnalytics,
  fetchMachineSummary,
  fetchRealtimePropertyHistory, // Added fetchRealtimePropertyHistory
} = require("../services/analyticsService");

// GET /api/analytics/overview
router.get("/overview", async (req, res) => {
  try {
    const period = req.query.period || "3m"; // e.g., '1h', '24h', '7d', '30d'
    const analytics = await fetchOverviewAnalytics(period);
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/machine/:machineId/summary
router.get("/machine/:machineId/summary", async (req, res) => {
  try {
    const machineId = req.params.machineId;
    const period = req.query.period || "3m";
    const summary = await fetchMachineSummary(machineId, period);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/property/:propertyName/history
router.get("/property/:propertyName/history", async (req, res) => {
  try {
    const propertyName = req.params.propertyName;
    const machineId = req.query.machineId || null;
    const lineId = req.query.lineId || null;
    const period = req.query.period || "24h";

    const history = await fetchPropertyHistory(
      propertyName,
      machineId,
      lineId,
      period
    );
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/analytics/realtime/:propertyName/history
router.get("/realtime/:propertyName/history", async (req, res) => {
  try {
    const propertyName = req.params.propertyName;
    const machineId = req.query.machineId || null;
    const lineId = req.query.lineId || null;
    const lastTimestamp = req.query.lastTimestamp || null; // ISO string or timestamp

    const history = await fetchRealtimePropertyHistory(
      propertyName,
      machineId,
      lineId,
      lastTimestamp
    );
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TEMPORARY DEBUG ENDPOINT: GET /api/analytics/debug/machine/:machineId/raw
router.get("/debug/machine/:machineId/raw", async (req, res) => {
  try {
    const machineId = req.params.machineId;
    const limit = Number(req.query.limit) || 10; // Fetch up to 10 records for inspection
    const records = await SensorDataModel.findAll({
      where: { machineId },
      order: [["createdAt", "DESC"]],
      limit,
    });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
