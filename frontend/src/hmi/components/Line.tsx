import React from "react";
import Machine from "./Machine";
import type { SensorData } from "../store";

interface LineProps {
  lineName: string;
  machines: SensorData[];
}

const Line: React.FC<LineProps> = ({ lineName, machines }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-6 shadow-lg">
      <h2 className="text-2xl text-white font-bold mb-4 border-b border-gray-600 pb-2">
        {lineName}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {machines.map((machine) => (
          <Machine key={machine.machine_id} machine={machine} />
        ))}
      </div>
    </div>
  );
};

export default Line;
