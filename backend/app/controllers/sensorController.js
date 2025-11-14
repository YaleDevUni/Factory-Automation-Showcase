const express = require("express");
const router = express.Router();
const { SensorDataModel } = require("../../db");

router.get("/sensor", async (req, res) => {
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

module.exports = router;
