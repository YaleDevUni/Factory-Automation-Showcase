const {
  AttributeIds,
  BrowseDirection,
  NodeClass,
  OPCUAClient,
} = require("node-opcua-client");

const OPCUA_ENDPOINT =
  process.env.OPCUA_ENDPOINT || "opc.tcp://localhost:4840/factory/";
const FACTORY_NODE_ID = process.env.OPCUA_FACTORY_NODE_ID || "ns=2;s=Factory";

const client = OPCUAClient.create({
  endpointMustExist: false,
  keepSessionAlive: true,
  connectionStrategy: {
    initialDelay: 500,
    maxRetry: 3,
  },
});

let sessionPromise = null;

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
      const activeSession = await sessionPromise;
      await activeSession.close();
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

const buildMachineRecord = async (session, lineRef, machineRef) => {
  const propertyRefs = await browseChildren(session, machineRef.nodeId);

  const properties = await Promise.all(
    propertyRefs
      .filter((ref) => ref.nodeClass === NodeClass.Variable)
      .map(async (propertyRef) => {
        const value = await readNodeValue(session, propertyRef.nodeId);
        return {
          property_name:
            propertyRef.displayName?.text || propertyRef.browseName.name,
          unit: null,
          value,
        };
      })
  );

  return {
    machine_id: numericIdFromString(
      `${lineRef.browseName.name}-${machineRef.browseName.name}`
    ),
    machine_name: machineRef.displayName?.text || machineRef.browseName.name,
    line_id: numericIdFromString(lineRef.browseName.name),
    properties,
  };
};

const buildLineRecords = async (session, lineRef) => {
  const machineRefs = await browseChildren(session, lineRef.nodeId);

  const machines = machineRefs.filter(
    (ref) => ref.nodeClass === NodeClass.Object
  );

  const records = [];

  for (const machineRef of machines) {
    records.push(await buildMachineRecord(session, lineRef, machineRef));
  }

  return records;
};

const getSensorData = async () => {
  try {
    const session = await ensureSession();
    const lineRefs = await browseChildren(session, FACTORY_NODE_ID);
    const lines = lineRefs.filter((ref) => ref.nodeClass === NodeClass.Object);

    const allRecords = [];
    for (const lineRef of lines) {
      const machines = await buildLineRecords(session, lineRef);
      allRecords.push(...machines);
    }

    return allRecords;
  } catch (error) {
    console.error("Failed to fetch sensor data from OPC UA", error.message);
    await resetSession();
    return [];
  }
};

module.exports = {
  getSensorData,
};
