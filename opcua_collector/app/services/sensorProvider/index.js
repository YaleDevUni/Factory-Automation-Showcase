const providers = {
  mock: require("./mockSensor"),
  opcua: require("./opcuaSensor"),
};

const resolveProvider = () => {
  const requested = (process.env.SENSOR_PROVIDER || "opcua")
    .toLowerCase()
    .trim();
  return providers[requested] || providers.opcua;
};

let provider = resolveProvider();

const set = (newProvider) => {
  provider = newProvider;
};

const get = () => {
  if (typeof provider.getSensorData !== "function") {
    throw new Error("Active sensor provider does not support get()");
  }
  return provider.getSensorData();
};

const subscribe = (handler) => {
  if (typeof provider.subscribe !== "function") {
    throw new Error("Active sensor provider does not support subscribe()");
  }
  return provider.subscribe(handler);
};

module.exports = {
  set,
  get,
  subscribe,
};
