import React, { useEffect, useState } from "react";
import { useAnalyticsStore } from "../store";
import { fetchRealtimeAlarmDetails } from "../../shared/api/analyticsApi";

const RealtimeAlarmList: React.FC = () => {
  const {
    selectedMachineId,
    isAutoFetchingEnabled,
    realtimeAlarmDetails,
    realtimeAlarmDetailsLoading,
    setRealtimeAlarmDetails,
    setRealtimeAlarmDetailsLoading,
    // Removed setError from store destructuring
  } = useAnalyticsStore();

  const [localError, setLocalError] = useState<string | null>(null); // Local error state

  // Effect for real-time alarm details polling
  // useEffect(() => {
  //   let intervalId: NodeJS.Timeout | null = null;

  //   const getRealtimeAlarmDetails = async () => {
  //     if (!selectedMachineId) {
  //       setRealtimeAlarmDetails([]);
  //       return;
  //     }
  //     setRealtimeAlarmDetailsLoading(true);
  //     setLocalError(null); // Use local error state
  //     try {
  //       const details = await fetchRealtimeAlarmDetails(selectedMachineId);
  //       setRealtimeAlarmDetails(details);
  //     } catch (err: any) {
  //       setLocalError(err.message); // Use local error state
  //     } finally {
  //       setRealtimeAlarmDetailsLoading(false);
  //     }
  //   };

  //   if (isAutoFetchingEnabled && selectedMachineId) {
  //     getRealtimeAlarmDetails(); // Initial fetch
  //     intervalId = setInterval(getRealtimeAlarmDetails, 1000); // Poll every 1 second
  //   } else {
  //     setRealtimeAlarmDetails([]); // Clear data if auto-fetching is disabled or no machine selected
  //   }

  //   return () => {
  //     if (intervalId) {
  //       clearInterval(intervalId);
  //     }
  //   };
  // }, [
  //   selectedMachineId,
  //   isAutoFetchingEnabled,
  //   setRealtimeAlarmDetails,
  //   setRealtimeAlarmDetailsLoading,
  // ]);

  if (localError)
    return <div className="text-red-500">Error: {localError}</div>; // Display local error

  return (
    <>
      {selectedMachineId && ( // Only render the container if a machine is selected
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Real-time Alarms for {selectedMachineId}
          </h2>
          {realtimeAlarmDetailsLoading ? (
            <div className="animate-pulse">
              <p className="h-4 bg-gray-200 rounded w-full mb-1"></p>
              <p className="h-4 bg-gray-200 rounded w-full mb-1"></p>
              <p className="h-4 bg-gray-200 rounded w-full mb-1"></p>
            </div>
          ) : realtimeAlarmDetails.length > 0 ? (
            <ul className="list-disc list-inside">
              {realtimeAlarmDetails.map((alarm, index) => (
                <li key={index} className="text-red-600">
                  <strong>
                    {new Date(alarm.timestamp).toLocaleTimeString()}:
                  </strong>{" "}
                  {alarm.propertyName} ({alarm.propertyValue}) -{" "}
                  {alarm.alarmMessage}
                </li>
              ))}
            </ul>
          ) : (
            <p>No real-time alarms detected for this machine.</p>
          )}
        </div>
      )}
    </>
  );
};

export default RealtimeAlarmList;
