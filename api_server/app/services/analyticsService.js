const { Op, Sequelize } = require("sequelize");
const { SensorDataModel } = require("../../../shared_db");

// Helper function to get time filter conditions
const getTimeFilterCondition = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "1h":
      startDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 24 hours
  }

  return {
    [Op.gte]: startDate,
  };
};

// Fetch aggregated data for charts
const fetchPropertyHistory = async (
  propertyName,
  machineId = null,
  lineId = null,
  period = "24h"
) => {
  const whereConditions = {
    createdAt: getTimeFilterCondition(period),
  };

  if (machineId) {
    whereConditions.machineId = machineId;
  }
  if (lineId) {
    whereConditions.lineId = lineId;
  }

  const records = await SensorDataModel.findAll({
    where: whereConditions,
    order: [["createdAt", "ASC"]],
  });

  const chartData = records
    .map((record) => {
      const properties = record.properties;
      const prop = properties.find((p) => p.property_name === propertyName);
      if (prop && prop.value !== null) {
        return {
          timestamp: record.createdAt,
          value: prop.value,
          machineId: record.machineId,
          lineId: record.lineId,
        };
      }
      return null;
    })
    .filter(Boolean);

  return chartData;
};

// Fetch overview analytics
const fetchOverviewAnalytics = async (period = "24h") => {
  const whereConditions = {
    createdAt: getTimeFilterCondition(period),
  };

  const machines = await SensorDataModel.findAll({
    attributes: ["machineId", "machineName"],
    group: ["machineId", "machineName"],
  });

  const machinesWithRecordCounts = await Promise.all(
    machines.map(async (machine) => {
      const machineId = machine.get({ plain: true }).machineId;
      const recordCount = await SensorDataModel.count({
        where: {
          ...whereConditions,
          machineId: machineId,
        },
      });
      return { ...machine.get({ plain: true }), recordCount };
    })
  );

  const totalRecords = machinesWithRecordCounts.reduce(
    (sum, machine) => sum + machine.recordCount,
    0
  );

  const lines = await SensorDataModel.findAll({
    attributes: ["lineId"],
    group: ["lineId"],
  });

  // Fetch all records within the period to extract unique property names
  const allRecordsInPeriod = await SensorDataModel.findAll({
    where: whereConditions,
    attributes: ["properties"],
  });

  const uniquePropertyNames = new Set();
  allRecordsInPeriod.forEach((record) => {
    if (record.properties && Array.isArray(record.properties)) {
      record.properties.forEach((prop) => {
        if (prop.property_name) {
          uniquePropertyNames.add(prop.property_name);
        }
      });
    }
  });

  return {
    totalRecords,
    machines: machinesWithRecordCounts, // Return machines with their record counts
    lines: lines.map(l => l.get({ plain: true })), // Return plain objects
    uniquePropertyNames: Array.from(uniquePropertyNames),
    period,
  };
};

// Fetch machine summary
const fetchMachineSummary = async (machineId, period = "24h") => {
  const whereConditions = {
    machineId,
    createdAt: getTimeFilterCondition(period),
  };

  const records = await SensorDataModel.findAll({
    where: whereConditions,
    order: [["createdAt", "DESC"]],
  });

  if (records.length === 0) {
    return {
      machineId,
      period,
      message: "No data found for this machine in the specified period.",
    };
  }

  const summary = {
    machineId,
    machineName: records[0].machineName,
    lineId: records[0].lineId,
    period,
    propertySummaries: {},
    alarmCount: 0,
  };

  const propertyValues = {};
  records.forEach((record) => {
    record.properties.forEach((prop) => {
      if (!propertyValues[prop.property_name]) {
        propertyValues[prop.property_name] = [];
      }
      if (prop.value !== null) {
        propertyValues[prop.property_name].push(prop.value);
      }
      if (prop.alarm) {
        summary.alarmCount++;
      }
    });
  });

  for (const propName in propertyValues) {
    const values = propertyValues[propName];
    if (values.length > 0) {
      summary.propertySummaries[propName] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[0],
      };
    }
  }

  return summary;
};

module.exports = {
  fetchPropertyHistory,
  fetchOverviewAnalytics,
  fetchMachineSummary,
};
