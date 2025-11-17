const sensorProvider = require("./sensorProvider");
const { SensorDataModel } = require("../../db");

const saveSensorData = async () => {
  const sensorData = await sensorProvider.get();
  if (!Array.isArray(sensorData) || sensorData.length === 0) {
    console.warn("No sensor data available to persist");
    return;
  }

  for (const data of sensorData) {
    await SensorDataModel.create({
      machineId: data.machine_id,
      machineName: data.machine_name,
      lineId: data.line_id,
      properties: data.properties,
    });
  }
  console.log("Machine data saved successfully");
};

module.exports = {
  saveSensorData,
};
