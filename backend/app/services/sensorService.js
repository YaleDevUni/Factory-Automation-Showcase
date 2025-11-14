const sensorProvider = require("./sensorProvider");
const { SensorDataModel } = require("../../db");

const saveSensorData = async () => {
  const sensorData = sensorProvider.get();
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
