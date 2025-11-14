let provider = require("./mockSensor");

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
