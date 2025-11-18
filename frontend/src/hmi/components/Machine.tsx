import React from 'react';
import Property from './Property';

interface SensorData {
  machine_id: number;
  machine_name: string;
  line_id: number;
  properties: {
    property_name: string;
    unit: string | null;
    value: number | null;
    alarm: boolean;
  }[];
}

interface MachineProps {
  machine: SensorData;
}

const Machine: React.FC<MachineProps> = ({ machine }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl text-white font-bold mb-3 border-b border-gray-600 pb-2">{machine.machine_name}</h2>
      <div className="grid grid-cols-1 gap-3">
        {machine.properties.map((prop) => (
          <Property
            key={`${machine.machine_id}-${prop.property_name}`}
            property={prop}
          />
        ))}
      </div>
    </div>
  );
};

export default Machine;
