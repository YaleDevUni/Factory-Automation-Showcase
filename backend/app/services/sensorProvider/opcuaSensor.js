const {
  AttributeIds,
  BrowseDirection,
  ClientMonitoredItem,
  ClientSubscription,
  NodeClass,
  OPCUAClient,
  TimestampsToReturn,
} = require("node-opcua-client");

const OPCUA_ENDPOINT =
  process.env.OPCUA_ENDPOINT || "opc.tcp://localhost:4840/factory/";
const FACTORY_NODE_ID = process.env.OPCUA_FACTORY_NODE_ID || null;
const SAMPLING_INTERVAL = Number(process.env.OPCUA_SAMPLING_INTERVAL || 500);

const client = OPCUAClient.create({
  endpointMustExist: false,
  keepSessionAlive: true,
  connectionStrategy: {
    initialDelay: 500,
    maxRetry: 3,
  },
});

let sessionPromise = null;
let monitoringPromise = null;
let subscription = null;
let factoryStructure = null; // array of machine descriptors
const snapshotByMachineId = new Map(); // machineId -> { descriptor, values: Map }
const nodeToProperty = new Map(); // nodeId string -> { machineId, propertyName }
const activeSubscribers = new Set();

const numericIdFromString = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0; // convert to 32bit int
  }
  return Math.abs(hash);
};

const ensureSession = async () => {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    await client.connect(OPCUA_ENDPOINT);
    return client.createSession();
  })();

  try {
    const session = await sessionPromise;
    return session;
  } catch (error) {
    sessionPromise = null;
    throw error;
  }
};

const resetSession = async () => {
  if (sessionPromise) {
    try {
      const existingSession = await sessionPromise;
      await existingSession.close();
    } catch (error) {
      console.error("Failed closing OPC UA session", error.message);
    }
  }

  sessionPromise = null;

  try {
    await client.disconnect();
  } catch (error) {
    console.error("Failed disconnecting OPC UA client", error.message);
  }
};

const browseChildren = async (session, nodeId) => {
  const browseResult = await session.browse({
    nodeId,
    browseDirection: BrowseDirection.Forward,
    includeSubtypes: true,
  });

  if (!browseResult || !browseResult.references) {
    return [];
  }

  return browseResult.references;
};

const readNodeValue = async (session, nodeId) => {
  const dataValue = await session.read({
    nodeId,
    attributeId: AttributeIds.Value,
  });

  return dataValue?.value?.value ?? null;
};

const resolveFactoryNodeId = async (session) => {
  // If user provided an explicit node id, trust it.
  if (FACTORY_NODE_ID) {
    return FACTORY_NODE_ID;
  }

  // Otherwise, discover "Factory" under the standard Objects folder (ns=0;i=85).
  const OBJECTS_FOLDER_NODE_ID = "ns=0;i=85";
  const children = await browseChildren(session, OBJECTS_FOLDER_NODE_ID);
  const factoryRef = children.find((ref) => {
    const name = ref.displayName?.text || ref.browseName?.name;
    return name === "Factory";
  });

  if (!factoryRef) {
    throw new Error(
      'OPC UA: Could not find "Factory" node under Objects folder (ns=0;i=85)'
    );
  }

  return factoryRef.nodeId;
};

const buildMachineDescriptors = async (session) => {
  const factoryNodeId = await resolveFactoryNodeId(session);
  const lineRefs = await browseChildren(session, factoryNodeId);
  const lines = lineRefs.filter((ref) => ref.nodeClass === NodeClass.Object);

  const machines = [];

  for (const lineRef of lines) {
    const lineName = lineRef.displayName?.text || lineRef.browseName.name;
    const lineId = numericIdFromString(lineName);

    const machineRefs = await browseChildren(session, lineRef.nodeId);
    const machineObjects = machineRefs.filter(
      (ref) => ref.nodeClass === NodeClass.Object
    );

    for (const machineRef of machineObjects) {
      const machineName =
        machineRef.displayName?.text || machineRef.browseName.name;
      const machineId = numericIdFromString(`${lineName}-${machineName}`);

      const propertyRefs = await browseChildren(session, machineRef.nodeId);
      const propertyVariables = propertyRefs.filter(
        (ref) => ref.nodeClass === NodeClass.Variable
      );

      const properties = propertyVariables.map((propertyRef) => ({
        property_name:
          propertyRef.displayName?.text || propertyRef.browseName.name,
        unit: null,
        nodeId: propertyRef.nodeId,
        nodeKey: propertyRef.nodeId.toString(),
      }));

      machines.push({
        line_id: lineId,
        line_name: lineName,
        machine_id: machineId,
        machine_name: machineName,
        nodeId: machineRef.nodeId,
        properties,
      });
    }
  }

  return machines;
};

const initializeSnapshot = (machines) => {
  snapshotByMachineId.clear();
  nodeToProperty.clear();

  machines.forEach((machine) => {
    snapshotByMachineId.set(machine.machine_id, {
      descriptor: machine,
      values: new Map(),
    });

    machine.properties.forEach((property) => {
      nodeToProperty.set(property.nodeKey, {
        machineId: machine.machine_id,
        propertyName: property.property_name,
      });
    });
  });
};

const materializeRecord = (machineId) => {
  const entry = snapshotByMachineId.get(machineId);
  if (!entry) {
    return null;
  }

  const { descriptor, values } = entry;

  return {
    machine_id: descriptor.machine_id,
    machine_name: descriptor.machine_name,
    line_id: descriptor.line_id,
    properties: descriptor.properties.map((property) => ({
      property_name: property.property_name,
      unit: property.unit,
      value: values.get(property.property_name) ?? null,
    })),
  };
};

const notifySubscribers = (records) => {
  if (!records || records.length === 0) {
    return;
  }

  activeSubscribers.forEach((handler) => {
    Promise.resolve(handler(records)).catch((error) =>
      console.error("Sensor subscriber handler failed", error)
    );
  });
};

const handleMonitoredValue = (nodeKey, value) => {
  const linkage = nodeToProperty.get(nodeKey);
  if (!linkage) {
    return;
  }

  const entry = snapshotByMachineId.get(linkage.machineId);
  if (!entry) {
    return;
  }

  entry.values.set(linkage.propertyName, value);
  const record = materializeRecord(linkage.machineId);
  if (record) {
    notifySubscribers([record]);
  }
};

const startMonitoring = async () => {
  if (monitoringPromise) {
    return monitoringPromise;
  }

  monitoringPromise = (async () => {
    const session = await ensureSession();
    if (!factoryStructure) {
      factoryStructure = await buildMachineDescriptors(session);
      initializeSnapshot(factoryStructure);
    }

    if (subscription) {
      return;
    }

    subscription = ClientSubscription.create(session, {
      requestedPublishingInterval: SAMPLING_INTERVAL,
      requestedLifetimeCount: 120,
      requestedMaxKeepAliveCount: 20,
      maxNotificationsPerPublish: 0,
      publishingEnabled: true,
      priority: 10,
    });

    subscription.on("terminated", async () => {
      subscription = null;
      monitoringPromise = null;
      await resetSession();
      if (activeSubscribers.size > 0) {
        startMonitoring().catch((error) =>
          console.error("Failed to re-establish OPC UA monitoring", error)
        );
      }
    });

    for (const machine of factoryStructure) {
      for (const property of machine.properties) {
        const monitoredItem = ClientMonitoredItem.create(
          subscription,
          {
            nodeId: property.nodeId,
            attributeId: AttributeIds.Value,
          },
          {
            samplingInterval: SAMPLING_INTERVAL,
            discardOldest: true,
            queueSize: 10,
          },
          TimestampsToReturn.Both
        );

        monitoredItem.on("changed", (dataValue) => {
          handleMonitoredValue(
            property.nodeKey,
            dataValue?.value?.value ?? null
          );
        });

        monitoredItem.on("err", (error) => {
          console.error(
            `OPC UA monitor error for ${property.property_name}`,
            error
          );
        });
      }
    }
  })();

  try {
    await monitoringPromise;
  } catch (error) {
    monitoringPromise = null;
    throw error;
  }
};

const stopMonitoring = async () => {
  if (subscription) {
    try {
      await subscription.terminate();
    } catch (error) {
      console.error("Failed to terminate OPC UA subscription", error);
    }
    subscription = null;
  }
  monitoringPromise = null;
  await resetSession();
};

const subscribe = async (handler) => {
  if (typeof handler !== "function") {
    throw new Error(
      "A handler function is required to subscribe to sensor data"
    );
  }

  activeSubscribers.add(handler);

  try {
    await startMonitoring();
  } catch (error) {
    activeSubscribers.delete(handler);
    throw error;
  }

  // Immediately emit the latest snapshot if we already have values.
  const warmStartRecords = Array.from(snapshotByMachineId.values())
    .map((entry) => materializeRecord(entry.descriptor.machine_id))
    .filter(Boolean);
  if (warmStartRecords.length > 0) {
    Promise.resolve(handler(warmStartRecords)).catch((error) =>
      console.error("Sensor subscriber warm start failed", error)
    );
  }

  return async () => {
    activeSubscribers.delete(handler);
    if (activeSubscribers.size === 0) {
      await stopMonitoring();
    }
  };
};

const getSensorData = async () => {
  try {
    const session = await ensureSession();
    if (!factoryStructure) {
      factoryStructure = await buildMachineDescriptors(session);
      initializeSnapshot(factoryStructure);
    }

    const records = [];
    for (const machine of factoryStructure) {
      const properties = [];
      for (const property of machine.properties) {
        const value = await readNodeValue(session, property.nodeId);
        properties.push({
          property_name: property.property_name,
          unit: property.unit,
          value,
        });
      }

      records.push({
        machine_id: machine.machine_id,
        machine_name: machine.machine_name,
        line_id: machine.line_id,
        properties,
      });
    }

    return records;
  } catch (error) {
    console.error("Failed to fetch sensor data from OPC UA", error.message);
    await resetSession();
    return [];
  }
};

module.exports = {
  getSensorData,
  subscribe,
};
