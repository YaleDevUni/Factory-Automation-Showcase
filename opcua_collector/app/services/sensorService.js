const sensorProvider = require("./sensorProvider");
const { SensorDataModel } = require("../../db");

let unsubscribeFn = null;
const streamState = {
  isStreaming: false,
  startedAt: null,
  lastBatchAt: null,
  lastBatchSize: 0,
  lastError: null,
};

const persistSensorBatch = async (sensorData) => {
  if (!Array.isArray(sensorData) || sensorData.length === 0) {
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
};

const startSensorStream = async () => {
  if (unsubscribeFn) {
    return;
  }

  try {
    unsubscribeFn = await sensorProvider.subscribe(async (records) => {
      try {
        await persistSensorBatch(records);
        streamState.lastBatchAt = new Date().toISOString();
        streamState.lastBatchSize = records.length;
        streamState.lastError = null;

      } catch (error) {
        streamState.lastError = error.message;
        console.error("Failed to persist streamed sensor data", error);
      }
    });
    streamState.isStreaming = true;
    streamState.startedAt = new Date().toISOString();
    console.log("Sensor data stream subscription established");
  } catch (error) {
    streamState.isStreaming = false;
    streamState.lastError = error.message;
    unsubscribeFn = null;
    throw error;
  }
};

const subscribeToSensorStream = async (handler) => {
  return sensorProvider.subscribe(handler);
};

const fetchCurrentSensorSnapshot = async () => {
  return sensorProvider.get();
};

const getSensorStreamStatus = () => {
  return {
    ...streamState,
    provider: process.env.SENSOR_PROVIDER || "opcua",
  };
};

module.exports = {
  startSensorStream,
  getSensorStreamStatus,
  subscribeToSensorStream,
  fetchCurrentSensorSnapshot,
};
