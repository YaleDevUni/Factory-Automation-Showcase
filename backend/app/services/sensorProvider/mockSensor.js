const baseMachines = [
  {
    machine_id: 1,
    machine_name: "Mixer 1",
    line_id: 101,
    properties: [
      { property_name: "speed", unit: "m/s", value: 5.5 },
      { property_name: "temperature", unit: "C", value: 80 },
    ],
  },
  {
    machine_id: 2,
    machine_name: "Pump 1",
    line_id: 101,
    properties: [{ property_name: "pressure", unit: "Pa", value: 200 }],
  },
  {
    machine_id: 3,
    machine_name: "Conveyor 1",
    line_id: 102,
    properties: [{ property_name: "speed", unit: "m/s", value: 2.2 }],
  },
];

const randomize = (value) => {
  const variance = value * 0.05;
  const min = value - variance;
  const max = value + variance;
  return Number((Math.random() * (max - min) + min).toFixed(2));
};

const getSensorData = () => {
  return baseMachines.map((machine) => ({
    ...machine,
    properties: machine.properties.map((property) => ({
      ...property,
      value: randomize(property.value),
    })),
  }));
};

const subscribe = (handler) => {
  if (typeof handler !== "function") {
    throw new Error("A handler function is required to subscribe to mock data");
  }

  const intervalMs = Number(process.env.MOCK_SENSOR_INTERVAL || 1000);
  const timer = setInterval(() => {
    Promise.resolve(handler(getSensorData())).catch((error) =>
      console.error("Mock sensor handler failed", error)
    );
  }, intervalMs);

  return () => clearInterval(timer);
};

module.exports = {
  getSensorData,
  subscribe,
};
