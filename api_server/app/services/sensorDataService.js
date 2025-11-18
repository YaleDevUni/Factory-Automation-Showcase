const { Op } = require("sequelize");
const { SensorDataModel } = require("../../../shared_db");

const defaultFindOptions = {
  order: [["createdAt", "DESC"]],
  limit: 20,
};

const fetchLatestRecords = async (limit = 20, options = {}) => {
  const orderDirection = options.ascending ? "ASC" : "DESC";
  return SensorDataModel.findAll({
    ...defaultFindOptions,
    order: [["createdAt", orderDirection]],
    limit,
  });
};

const fetchByLineId = async (lineId, limit = 100) => {
  return SensorDataModel.findAll({
    where: { lineId },
    order: [["createdAt", "DESC"]],
    limit,
  });
};

const fetchByMachineId = async (machineId, limit = 100) => {
  return SensorDataModel.findAll({
    where: { machineId },
    order: [["createdAt", "DESC"]],
    limit,
  });
};

const fetchRecordsAfter = async (timestamp, limit = 100) => {
  const where = timestamp
    ? {
        createdAt: {
          [Op.gt]: new Date(timestamp),
        },
      }
    : undefined;

  return SensorDataModel.findAll({
    where,
    order: [["createdAt", "ASC"]],
    limit,
  });
};

const getDatabaseHealth = async () => {
  try {
    await SensorDataModel.sequelize.authenticate();
    const totalCount = await SensorDataModel.count();
    return {
      healthy: true,
      totalRecords: totalCount,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      checkedAt: new Date().toISOString(),
      message: error.message,
    };
  }
};

module.exports = {
  fetchLatestRecords,
  fetchByLineId,
  fetchByMachineId,
  fetchRecordsAfter,
  getDatabaseHealth,
};
