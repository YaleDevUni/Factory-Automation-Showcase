import { fetchRealtimeAlarmDetails } from "../../shared/api/analyticsApi";
import CircularChart from "./CircularChart";
import { useAnalyticsStore } from "../store";
import { useState,useEffect } from "react";

interface Alarm {
  timestamp: string;
  propertyName: string;
  propertyValue: any;
  alarmMessage: string;
}

const RealtimeAlarmList: React.FC = () => {
  const {
    selectedMachineId,
    isAutoFetchingEnabled,
    realtimeAlarmDetails,
    realtimeAlarmDetailsLoading,
    setRealtimeAlarmDetails,
    setRealtimeAlarmDetailsLoading,
    allPropertyHistoryData,
  } = useAnalyticsStore();

  const [localError, setLocalError] = useState<string | null>(null);
  const [propertyStatusData, setPropertyStatusData] = useState<
    { propertyName: string; normalCount: number; alarmCount: number }[]
  >([]);

  useEffect(() => {
    const calculatePropertyStatus = () => {
      const statusMap: Record<
        string,
        { normalCount: number; alarmCount: number }
      > = {};

      // Initialize with total counts from allPropertyHistoryData
      Object.entries(allPropertyHistoryData).forEach(
        ([propertyName, history]) => {
          statusMap[propertyName] = {
            normalCount: history.length,
            alarmCount: 0,
          };
        },
      );

      // Subtract alarm counts from realtimeAlarmDetails
      realtimeAlarmDetails.forEach((alarm) => {
        if (statusMap[alarm.propertyName]) {
          statusMap[alarm.propertyName].alarmCount++;
          statusMap[alarm.propertyName].normalCount--; // Decrement normal count for alarms
        } else {
          // Handle cases where an alarm exists but no history data is present (shouldn't happen if data is consistent)
          statusMap[alarm.propertyName] = { normalCount: 0, alarmCount: 1 };
        }
      });

      // Ensure normalCount doesn't go below zero
      Object.keys(statusMap).forEach((propertyName) => {
        if (statusMap[propertyName].normalCount < 0) {
          statusMap[propertyName].normalCount = 0;
        }
      });

      setPropertyStatusData(
        Object.entries(statusMap).map(([propertyName, counts]) => ({
          propertyName,
          ...counts,
        })),
      );
    };

    calculatePropertyStatus();
  }, [realtimeAlarmDetails, allPropertyHistoryData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const getRealtimeAlarmDetails = async () => {
      if (!selectedMachineId) {
        setRealtimeAlarmDetails([]);
        return;
      }
      // setRealtimeAlarmDetailsLoading(true); // intentional commenting don't uncomment this
      setLocalError(null);
      try {
        const details = await fetchRealtimeAlarmDetails(selectedMachineId);
        setRealtimeAlarmDetails(details);
      } catch (err: any) {
        setLocalError(err.message);
      } finally {
        setRealtimeAlarmDetailsLoading(false);
      }
    };

    if (isAutoFetchingEnabled && selectedMachineId) {
      getRealtimeAlarmDetails();
      intervalId = setInterval(getRealtimeAlarmDetails, 1000);
    } else {
      setRealtimeAlarmDetails([]);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    selectedMachineId,
    isAutoFetchingEnabled,
    setRealtimeAlarmDetails,
    setRealtimeAlarmDetailsLoading,
  ]);

  if (localError)
    return <div className="text-red-500 p-4">Error: {localError}</div>;

  // Group alarms by propertyName
  const groupedAlarms = realtimeAlarmDetails.reduce((acc, alarm) => {
    if (!acc[alarm.propertyName]) {
      acc[alarm.propertyName] = [];
    }
    acc[alarm.propertyName].push(alarm);
    return acc;
  }, {} as Record<string, Alarm[]>);

  return (
    <>
      {selectedMachineId && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Real-time Alarms for {selectedMachineId}
          </h2>
          {realtimeAlarmDetailsLoading ? (
            <div className="animate-pulse">
              <p className="h-4 bg-gray-200 rounded w-full mb-1"></p>
              <p className="h-4 bg-gray-200 rounded w-full mb-1"></p>
              <p className="h-4 bg-gray-200 rounded w-full mb-1"></p>
            </div>
          ) : Object.keys(groupedAlarms).length > 0 ? (
            <div className="flex flex-wrap gap-4">
              <div className="flex overflow-x-auto gap-4 flex-grow">
                {Object.entries(groupedAlarms).map(([propertyName, alarms]) => (
                  <div
                    key={propertyName}
                    className="border border-red-300 rounded p-3 flex-shrink-0"
                  >
                    <h3 className="text-md font-semibold text-red-700 mb-2">
                      Property: {propertyName}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                      {alarms.map((alarm, index) => (
                        <li key={index} className="text-red-600 text-sm">
                          <strong>
                            {new Date(alarm.timestamp).toLocaleTimeString()}:
                          </strong>{" "}
                          Value: {alarm.propertyValue} - {alarm.alarmMessage}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {propertyStatusData.map((data) => (
                  <CircularChart
                    key={data.propertyName}
                    title={`Status for ${data.propertyName}`}
                    data={[
                      { name: "Normal", value: data.normalCount },
                      { name: "Alarm", value: data.alarmCount },
                    ]}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              No real-time alarms detected for this machine.
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default RealtimeAlarmList;
