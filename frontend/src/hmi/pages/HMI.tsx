import React, { useEffect, useMemo } from "react";
import useWebSocket from "../../shared/hooks/useWebSocket";
import { useHmiStore } from "../store";
import type { SensorData } from "../store";
import Line from "../components/Line";
import Alarms from "../components/Alarms";

const HMI: React.FC = () => {
  const { data, isConnecting } = useWebSocket("ws://localhost:8080");
  const { machines, updateMachine } = useHmiStore();

  useEffect(() => {
    if (data) {
      data.forEach((machineData: SensorData) => {
        updateMachine(machineData);
      });
    }
  }, [data, updateMachine]);

  // Group machines by line_id
  const machinesByLine = useMemo(() => {
    const grouped: { [key: string]: SensorData[] } = {};
    machines.forEach((machine) => {
      const lineName = `Line ${machine.line_id}`;
      if (!grouped[lineName]) {
        grouped[lineName] = [];
      }
      grouped[lineName].push(machine);
    });
    return grouped;
  }, [machines]);

  return (
    <div className="mx-auto p-4 bg-gray-900 min-h-screen text-white">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-400">
        Factory HMI Dashboard
      </h1>
      {isConnecting && (
        <p className="text-center text-yellow-400 text-lg">
          Connecting to WebSocket...
        </p>
      )}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-8">
          {Object.entries(machinesByLine).map(([lineName, lineMachines]) => (
            <Line key={lineName} lineName={lineName} machines={lineMachines} />
          ))}
        </div>
        <div className=" w-64">
          <Alarms />
        </div>
      </div>
    </div>
  );
};

export default HMI;
