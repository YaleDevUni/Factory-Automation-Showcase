const Sequelize = require("sequelize");
const SensorData = require("../models/sensordata");
const dotenv = require("dotenv");
dotenv.config();
// alert if process.env.DATABASE_URL is not set
if (!process.env.DIALECT && !process.env.STORAGE) {
  throw new Error("DIALECT and STORAGE are not set check db/index.js");
}
const sequelize = new Sequelize({
  dialect: process.env.DIALECT,
  storage: process.env.STORAGE,
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
