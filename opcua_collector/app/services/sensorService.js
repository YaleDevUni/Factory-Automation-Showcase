const sensorProvider = require("./sensorProvider");
const { SensorDataModel } = require("../../../shared_db");

let unsubscribeFn = null;
const streamState = {
  isStreaming: false,
  startedAt: null,
  lastBatchAt: null,
  lastBatchSize: 0,
  lastError: null,
};

const lastPersistedSnapshots = new Map();

const serializeRecord = (record) => {
  if (!record) {
    return "";
  }

  // Properties are emitted in a stable order by the provider,
  // so JSON.stringify is sufficient for change detection.
  return JSON.stringify(record.properties);
};

const persistSensorBatch = async (sensorData) => {
  if (!Array.isArray(sensorData) || sensorData.length === 0) {
    return 0;
  }

  const recordsToPersist = [];

  for (const data of sensorData) {
    const snapshotKey = serializeRecord(data);
    const previousSnapshot = lastPersistedSnapshots.get(data.machine_id);
    if (snapshotKey === previousSnapshot) {
      continue;
    }

    lastPersistedSnapshots.set(data.machine_id, snapshotKey);

    recordsToPersist.push({
      machineId: data.machine_id,
      machineName: data.machine_name,
      lineId: data.line_id,
      properties: data.properties,
    });
  }

  if (recordsToPersist.length === 0) {
    return 0;
  }

  await SensorDataModel.bulkCreate(recordsToPersist);
  return recordsToPersist.length;
};

const startSensorStream = async () => {
  if (unsubscribeFn) {
    return;
  }

  try {
    unsubscribeFn = await sensorProvider.subscribe(async (records) => {
      try {
        const persistedCount = await persistSensorBatch(records);
        streamState.lastBatchAt = new Date().toISOString();
        streamState.lastBatchSize = persistedCount;
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
