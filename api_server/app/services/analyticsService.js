const { Op, Sequelize } = require("sequelize");
const { SensorDataModel } = require("../../../shared_db");

// Helper function to get time filter conditions
const getTimeFilterCondition = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "1m":
      startDate = new Date(now.getTime() - 1 * 60 * 1000);
      break;
    case "3m":
      startDate = new Date(now.getTime() - 3 * 60 * 1000);
      break;
    case "5m":
      startDate = new Date(now.getTime() - 5 * 60 * 1000);
      break;
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
      startDate = new Date(now.getTime() - 1 * 60 * 1000); // Default to 1 minute for live charts
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
  console.log(`fetchPropertyHistory: Fetched ${records.length} records for machineId: ${machineId}, propertyName: ${propertyName}, period: ${period}`);

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
      console.log(`fetchPropertyHistory: Property "${propertyName}" not found or value is null in record for machineId: ${record.machineId}`);
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

  const allUniquePropertyNames = new Set();

  const machinesWithRecordCounts = await Promise.all(
    machines.map(async (machine) => {
      const machineId = machine.get({ plain: true }).machineId;
      const recordCount = await SensorDataModel.count({
        where: {
          ...whereConditions,
          machineId: machineId,
        },
      });

      // Fetch unique property names for this specific machine within the period
      const machineRecordsInPeriod = await SensorDataModel.findAll({
        where: {
          ...whereConditions,
          machineId: machineId,
        },
        attributes: ["properties"],
      });

      const uniqueMachinePropertyNames = new Set();
      machineRecordsInPeriod.forEach((record) => {
        if (record.properties && Array.isArray(record.properties)) {
          record.properties.forEach((prop) => {
            if (prop.property_name) {
              uniqueMachinePropertyNames.add(prop.property_name);
              allUniquePropertyNames.add(prop.property_name); // Add to overall set
            }
          });
        }
      });

      return {
        ...machine.get({ plain: true }),
        recordCount,
        properties: Array.from(uniqueMachinePropertyNames),
      };
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

  return {
    totalRecords,
    machines: machinesWithRecordCounts, // Return machines with their record counts and properties
    lines: lines.map(l => l.get({ plain: true })), // Return plain objects
    period,
    uniquePropertyNames: Array.from(allUniquePropertyNames), // Add top-level unique property names
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

const fetchRealtimePropertyHistory = async (
  propertyName,
  machineId = null,
  lineId = null,
  lastTimestamp = null
) => {
  const now = new Date();
  const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000); // 3 minutes ago

  let createdAtCondition = {
    [Op.gte]: threeMinutesAgo,
    [Op.lte]: now,
  };

  if (lastTimestamp) {
    const lastReqTime = new Date(lastTimestamp);
    // Ensure we only get data *after* the last request, but still within the 3-minute window
    createdAtCondition = {
      [Op.gt]: lastReqTime,
      [Op.lte]: now,
    };
  }

  const whereConditions = {
    createdAt: createdAtCondition,
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

  console.log(`fetchRealtimePropertyHistory: Fetched ${records.length} records for machineId: ${machineId}, propertyName: ${propertyName}, lastTimestamp: ${lastTimestamp}`);

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

const fetchRealtimeOverview = async (machineId, lineId = null) => {
  const now = new Date();
  const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

  const whereConditions = {
    machineId,
    createdAt: {
      [Op.gte]: threeMinutesAgo,
      [Op.lte]: now,
    },
  };

  if (lineId) {
    whereConditions.lineId = lineId;
  }

  const latestRecord = await SensorDataModel.findOne({
    where: whereConditions,
    order: [["createdAt", "DESC"]], // Get the most recent record
  });

  if (!latestRecord) {
    return {
      machineId,
      lineId,
      message: "No real-time data found for this machine in the last 3 minutes.",
    };
  }

  let alarmCount = 0;
  const latestPropertyValues = {};

  latestRecord.properties.forEach((prop) => {
    if (prop.alarm) {
      alarmCount++;
    }
    latestPropertyValues[prop.property_name] = prop.value;
  });

  return {
    machineId: latestRecord.machineId,
    machineName: latestRecord.machineName,
    lineId: latestRecord.lineId,
    timestamp: latestRecord.createdAt,
    alarmCount,
    latestPropertyValues,
  };
};

const fetchRealtimeAlarmDetails = async (machineId, lineId = null) => {
  const now = new Date();
  const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);

  const whereConditions = {
    machineId,
    createdAt: {
      [Op.gte]: threeMinutesAgo,
      [Op.lte]: now,
    },
  };

  if (lineId) {
    whereConditions.lineId = lineId;
  }

  const records = await SensorDataModel.findAll({
    where: whereConditions,
    order: [["createdAt", "DESC"]], // Get most recent first
  });

  const alarmDetails = [];

  records.forEach(record => {
    record.properties.forEach(prop => {
      if (prop.alarm) {
        alarmDetails.push({
          timestamp: record.createdAt,
          machineId: record.machineId,
          machineName: record.machineName,
          lineId: record.lineId,
          propertyName: prop.property_name,
          propertyValue: prop.value,
          alarmMessage: prop.alarm_message || `Alarm triggered for ${prop.property_name}`,
        });
      }
    });
  });

  return alarmDetails;
};

module.exports = {
  fetchPropertyHistory,
  fetchOverviewAnalytics,
  fetchMachineSummary,
  fetchRealtimePropertyHistory,
  fetchRealtimeOverview,
  fetchRealtimeAlarmDetails, // Export the new function
};
