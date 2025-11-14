const express = require("express");
const router = express.Router();
const { SensorDataModel } = require("../../db");

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

module.exports = router;
