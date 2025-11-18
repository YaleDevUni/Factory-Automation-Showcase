"use strict";

module.exports = (sequelize, DataTypes) => {
  const SensorData = sequelize.define(
    "SensorData",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      machineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "machine_id",
      },
      machineName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "machine_name",
      },
      lineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "line_id",
      },
      properties: {
        type: DataTypes.JSON,
        allowNull: false,
      },
    },
    {
      tableName: "sensor_data",
      underscored: true,
      indexes: [
        {
          fields: ["machine_id"],
        },
        {
          fields: ["line_id"],
        },
      ],
    }
  );

  SensorData.associate = () => {
    // define associations here when available
  };

  return SensorData;
};
