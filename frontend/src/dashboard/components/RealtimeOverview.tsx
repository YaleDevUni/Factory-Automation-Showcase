import React, { useEffect, useState } from "react";
import { useAnalyticsStore } from "../store";
import { fetchRealtimeOverview } from "../../shared/api/analyticsApi";

const RealtimeOverview: React.FC = () => {
  const {
    selectedMachineId,
    isAutoFetchingEnabled, // Get from store
    realtimeOverviewData,
    realtimeOverviewLoading,
    setRealtimeOverviewData,
    setRealtimeOverviewLoading,
    setError,
  } = useAnalyticsStore();

  // Effect for real-time overview polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const getRealtimeOverview = async () => {
      if (!selectedMachineId) {
        setRealtimeOverviewData(null);
        return;
      }
      setRealtimeOverviewLoading(true);
      setError(null);
      try {
        const overview = await fetchRealtimeOverview(selectedMachineId);
        setRealtimeOverviewData(overview);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setRealtimeOverviewLoading(false);
      }
    };

    if (isAutoFetchingEnabled && selectedMachineId) {
      getRealtimeOverview(); // Initial fetch
      intervalId = setInterval(getRealtimeOverview, 1000); // Poll every 1 second
    } else {
      setRealtimeOverviewData(null); // Clear data if auto-fetching is disabled or no machine selected
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    selectedMachineId,
    isAutoFetchingEnabled,
    // setRealtimeOverviewData,
    // setRealtimeOverviewLoading,
  ]);

  // if (realtimeOverviewLoading) return <div className="p-4">Loading real-time overview...</div>;

  return (
    <>
      {realtimeOverviewData && selectedMachineId && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">
           Overview:{" "}
            {realtimeOverviewData.machineName || selectedMachineId}
          </h2>
          {realtimeOverviewData.message ? (
            <p>{realtimeOverviewData.message}</p>
          ) : (
            <div>
              <p>
                <strong>Line ID:</strong> {realtimeOverviewData.lineId}
              </p>
              <p>
                <strong>Latest Timestamp:</strong>{" "}
                {new Date(realtimeOverviewData.timestamp).toLocaleString()}
              </p>
              <p>
                <strong>Alarm Count:</strong> {realtimeOverviewData.alarmCount}
              </p>
              <h3 className="text-md font-semibold mt-4">
                Latest Property Values:
              </h3>
              {Object.keys(realtimeOverviewData.latestPropertyValues).length >
              0 ? (
                <ul className="list-disc list-inside">
                  {Object.entries(
                    realtimeOverviewData.latestPropertyValues
                  ).map(([propName, value]: [string, any]) => (
                    <li key={propName}>
                      <strong>{propName}:</strong> {value?.toFixed(2) || value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No property values available.</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default RealtimeOverview;
