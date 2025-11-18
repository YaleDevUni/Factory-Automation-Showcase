import React, { useMemo } from "react";
import { useHmiStore } from "../store";

const Alarms: React.FC = () => {
  const machines = useHmiStore((state) => state.machines);

  const alarms = useMemo(() => {
    return machines.flatMap((machine) =>
      machine.properties
        .filter((p) => p.alarm)
        .map((p) => ({
          machineName: machine.machine_name,
          propertyName: p.property_name,
          value: p.value,
        }))
    );
  }, [machines]);

  const hasAlarms = alarms.length > 0;
  const bgColorClass = hasAlarms ? "bg-red-800" : "bg-gray-700";

  return (
    <div className={`${bgColorClass} text-white p-4 rounded-lg shadow-lg mb-6 flex flex-col`}>
      <h2 className="text-2xl font-bold mb-2">Active Alarms</h2>
      <div className="flex-1 min-h-[150px] overflow-y-auto">
        {hasAlarms ? (
          <ul>
            {alarms.map((alarm, index) => (
              <li
                key={index}
                className="border-b border-red-700 last:border-b-0 py-1"
              >
                <span className="font-semibold">{alarm.machineName}:</span>{" "}
                {alarm.propertyName} is at{" "}
                <span className="font-bold">{alarm.value?.toFixed(2)}</span>{" "}
                (High)
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-300 font-bold flex items-center justify-center h-full">No active alarms.</p>
        )}
      </div>
    </div>
  );
};

export default Alarms;
