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
  return provider.getSensorData();
};

module.exports = {
  set,
  get,
};
