import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart,
  Area, // Added Area import
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchRealtimePropertyHistory } from "../../shared/api/analyticsApi";

interface RealtimePropertyLineChartProps {
  propName: string;
  machineId: string;
  lineId?: string | null;
  isAutoFetchingEnabled: boolean;
  initialData: any[]; // New prop for initial data
}

const RealtimePropertyLineChart: React.FC<RealtimePropertyLineChartProps> = ({
  propName,
  machineId,
  lineId = null,
  isAutoFetchingEnabled,
  initialData, // Destructure initialData
}) => {
  const [chartData, setChartData] = useState<any[]>(initialData); // Initialize with initialData
  const lastTimestampRef = useRef<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to store the latest fetchData function
  const fetchDataRef = useRef<() => Promise<void>>();

  // Define fetchData using useCallback, dependent on props
  const fetchDataCallback = useCallback(async () => {
    if (!machineId || !propName) return;

    setLoading(true);
    setError(null);
    try {
      const newData = await fetchRealtimePropertyHistory(
        propName,
        machineId,
        lineId,
        lastTimestampRef.current
      );

      if (newData && newData.length > 0) {
        setChartData((prevData) => {
          const updatedData = [...prevData, ...newData];
          // Keep only the last 3 minutes of data
          const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
          return updatedData.filter(
            (d) => new Date(d.timestamp) >= threeMinutesAgo
          );
        });
        lastTimestampRef.current = newData[newData.length - 1].timestamp;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propName, machineId, lineId]); // Dependencies for useCallback

  // Update the ref whenever fetchDataCallback changes
  useEffect(() => {
    fetchDataRef.current = fetchDataCallback;
  }, [fetchDataCallback]);

  // Effect for initial data setup when props change
  useEffect(() => {
    setChartData(initialData); // Set chartData from initialData
    if (initialData.length > 0) {
      lastTimestampRef.current = initialData[initialData.length - 1].timestamp;
    } else {
      lastTimestampRef.current = null;
    }
    // Removed fetchData() call here as Dashboard.tsx handles initial fetch
  }, [propName, machineId, lineId, initialData]); // initialData is a dependency here

  // Effect for setting up and clearing the polling interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isAutoFetchingEnabled) {
      intervalId = setInterval(() => {
        // Call the function via ref
        if (fetchDataRef.current) {
          fetchDataRef.current();
        }
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoFetchingEnabled]); // No fetchDataCallback dependency here

  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (loading && chartData.length === 0)
    return <div>Loading real-time data...</div>;

  // If no data and not loading or error, return null to hide the component
  if (chartData.length === 0 && !loading && !error) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-lg font-semibold mb-2">
        Real-time {propName} for {machineId}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData.map((d) => ({
            ...d,
            timestamp: new Date(d.timestamp).toLocaleTimeString(),
          }))}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          isAnimationActive={false} // Remove animation from the chart
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#AA4A44" stopOpacity={1} />
              <stop offset="95%" stopColor="#AA4A44" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#AA4A44"
            fill="url(#colorValue)" // Apply gradient fill
            isAnimationActive={false} // Remove animation from the area
            // dot={<CustomDot />} // Use the custom dot component
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealtimePropertyLineChart;
