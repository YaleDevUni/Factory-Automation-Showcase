const Sequelize = require("sequelize");
const SensorData = require("./models/sensordata");
const dotenv = require("dotenv");
const { resolveStoragePath, defaultStorage } = require("./utils/storage");

dotenv.config();

const dialect = process.env.DIALECT || "sqlite";
const storageEnv = process.env.SHARED_DB_STORAGE || process.env.STORAGE;
const storage = resolveStoragePath(storageEnv) || defaultStorage;

const sequelize = new Sequelize({
  dialect,
  storage,
});

const SensorDataModel = SensorData(sequelize, Sequelize.DataTypes);
const initDatabase = async () => {
  const forceSync = process.env.DB_SYNC_FORCE === "true";
  await sequelize.sync({ force: forceSync });
  console.log(`Database synchronized (force: ${forceSync})`);
};

module.exports = {
  sequelize,
  initDatabase,
  SensorDataModel,
};
