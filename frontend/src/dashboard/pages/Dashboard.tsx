import React, { useEffect, useCallback, useState } from "react";
import { useAnalyticsStore } from "../store";
import {
  fetchOverviewAnalytics,
  fetchMachineSummary,
  fetchRealtimePropertyHistory,
} from "../../shared/api/analyticsApi";
import RealtimePropertyLineChart from "../components/RealtimePropertyLineChart";
import RealtimeOverview from "../components/RealtimeOverview"; // Import RealtimeOverview component
import RealtimeAlarmList from "../components/RealtimeAlarmList"; // Import RealtimeAlarmList component

const Dashboard: React.FC = () => {
  const {
    overviewData,
    machineSummaryData,
    overviewLoading,
    chartsLoading,
    error,
    selectedPeriod,
    selectedMachineId,
    machines,
    properties,
    isAutoFetchingEnabled, // Get from store
    setOverviewData,
    setMachineSummaryData,
    setOverviewLoading,
    setChartsLoading,
    setError,
    setSelectedPeriod,
    setSelectedMachineId,
    setMachines,
    setProperties,
    setIsAutoFetchingEnabled, // Get from store
    realtimeAlarmDetailsLoading, // Get from store
  } = useAnalyticsStore();
  console.log(
    "Dashboard Render: selectedMachineId:",
    selectedMachineId,
    "properties:",
    properties
  );

  // Removed local isAutoFetchingEnabled state

  const [initialRealtimeData, setInitialRealtimeData] = useState<{
    [propertyName: string]: any[];
  }>({});
  const [initialRealtimeLoading, setInitialRealtimeLoading] = useState(false);

  // Fetch overview data on component mount and when selectedPeriod changes
  useEffect(() => {
    console.log("useEffect [selectedPeriod] triggered for overview data.");
    const getOverviewData = async () => {
      setOverviewLoading(true);
      setError(null);
      try {
        const data = await fetchOverviewAnalytics(selectedPeriod);
        console.log("getOverviewData: Fetched data:", data);
        setOverviewData(data);
        setMachines(data.machines);
        setProperties(data.uniquePropertyNames);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setOverviewLoading(false);
      }
    };
    getOverviewData();
  }, [
    selectedPeriod,
    // setOverviewData,
    // setMachines,
    // setProperties,
    // setOverviewLoading,
    // setError,
  ]);

  // Effect to automatically select the first machine if available
  useEffect(() => {
    if (machines.length > 0 && !selectedMachineId) {
      setSelectedMachineId(machines[0].machineId);
      console.log("Auto-selecting first machine:", machines[0].machineId);
    }
  }, [machines, selectedMachineId]);

  // Effect to fetch initial real-time data for all properties
  useEffect(() => {
    if (!selectedMachineId || properties.length === 0) {
      setInitialRealtimeData({});
      return;
    }

    const fetchAllInitialRealtimeData = async () => {
      setInitialRealtimeLoading(true);
      setError(null);
      try {
        const allData: { [propertyName: string]: any[] } = {};
        for (const propName of properties) {
          const data = await fetchRealtimePropertyHistory(
            propName,
            selectedMachineId,
            null, // lineId
            null // lastTimestamp to get initial 3 minutes
          );
          allData[propName] = data;
        }
        setInitialRealtimeData(allData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setInitialRealtimeLoading(false);
      }
    };

    fetchAllInitialRealtimeData();
  }, [selectedMachineId, properties]); // Dependencies for this useEffect

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(event.target.value);
  };

  const handleMachineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMachineId(event.target.value);
  };

  if (overviewLoading || initialRealtimeLoading || realtimeAlarmDetailsLoading)
    return <div className="p-4">Loading dashboard...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  const propertiesWithData = properties.filter(
    (propName) =>
      initialRealtimeData[propName] && initialRealtimeData[propName].length > 0
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MES/ERP Dashboard</h1>

      <div className="mb-4 flex space-x-4">
        <div>
          <label htmlFor="period-select" className="mr-2">
            Select Period:
          </label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="border rounded p-1"
          >
            <option value="3m">Last 3 Minutes (Real-time)</option>
          </select>
        </div>

        <div>
          <label htmlFor="machine-select" className="mr-2">
            Select Machine:
          </label>
          <select
            id="machine-select"
            value={selectedMachineId || ""}
            onChange={handleMachineChange}
            className="border rounded p-1"
            disabled={machines.length === 0}
          >
            <option value="">-- Select a Machine --</option>
            {machines.map((machine) => (
              <option key={machine.machineId} value={machine.machineId}>
                {machine.machineName || machine.machineId}
              </option>
            ))}
          </select>
        </div>

        {/* Auto-Fetching Toggle Button */}
        {/* <button
          onClick={() => setIsAutoFetchingEnabled(!isAutoFetchingEnabled)}
          className={`px-4 py-2 rounded ${
            isAutoFetchingEnabled
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {isAutoFetchingEnabled ? "Stop Auto-Fetch" : "Start Auto-Fetch"}
        </button> */}
      </div>

      {/* Real-time Overview Component */}
      <RealtimeOverview />

      {/* Existing Machine Summary Section (can be removed or integrated if desired) */}
      {machineSummaryData && selectedMachineId && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Machine Summary:{" "}
            {machineSummaryData.machineName || selectedMachineId}
          </h2>
          {machineSummaryData.message ? (
            <p>{machineSummaryData.message}</p>
          ) : (
            <div>
              <p>
                <strong>Line ID:</strong> {machineSummaryData.lineId}
              </p>
              <p>
                <strong>Alarms:</strong> {machineSummaryData.alarmCount}
              </p>
              <h3 className="text-md font-semibold mt-4">
                Property Summaries:
              </h3>
              {Object.keys(machineSummaryData.propertySummaries).length > 0 ? (
                <ul className="list-disc list-inside">
                  {Object.entries(machineSummaryData.propertySummaries).map(
                    ([propName, summary]: [string, any]) => (
                      <li key={propName}>
                        <strong>{propName}:</strong> Avg:{" "}
                        {summary.avg?.toFixed(2)}, Min:{" "}
                        {summary.min?.toFixed(2)}, Max:{" "}
                        {summary.max?.toFixed(2)}, Latest:{" "}
                        {summary.latest?.toFixed(2)}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p>No property summaries available for this period.</p>
              )}
            </div>
          )}
        </div>
      )}

      {selectedMachineId && propertiesWithData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {propertiesWithData.map((propName) => (
            <RealtimePropertyLineChart
              key={propName}
              propName={propName}
              machineId={selectedMachineId}
              isAutoFetchingEnabled={isAutoFetchingEnabled}
              initialData={initialRealtimeData[propName]} // Pass initial data
            />
          ))}
        </div>
      ) : (
        selectedMachineId && (
          <div className="p-4 text-center">
            No chart data available for the selected machine and period.
          </div>
        )
      )}

      {/* Real-time Alarm List Component */}
      <RealtimeAlarmList />
    </div>
  );
};

export default Dashboard;
