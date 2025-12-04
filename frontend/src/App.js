import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import SummaryTable from "./components/SummaryTable";
import MetricsAreaChart from "./components/MetricsAreaChart";

const API_BASE = "http://localhost:8000/api";

function App() {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [thresholdMinutes, setThresholdMinutes] = useState(60);
  const [thresholdResults, setThresholdResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  //state for ID-threshold bar chart
  const [idThresholdData, setIdThresholdData] = React.useState([]);
  const [idThresholdError, setIdThresholdError] = React.useState("");
  const [idThresholdLoading, setIdThresholdLoading] = React.useState(false);

  //table controls
  const [pageSize, setPageSize] = useState(5); // 5, 10, 20, 30
  const [searchTerm, setSearchTerm] = useState(""); // search by id

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload CSV to backend
  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Please select a CSV file first.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { summary, metrics } = res.data;
      console.log("Summary:", summary);
      console.log("Metrics:", metrics);
      const allowed = [
        "id",
        "count",
        "min_gap",
        "max_gap",
        "mean_gap",
        "median_gap",
        "std_gap",
        "p75",
        "p90",
        "p95",
        "p99",
      ];

      const filteredSummary = summary.map((row) =>
        Object.fromEntries(
          Object.entries(row).filter(([key]) => allowed.includes(key))
        )
      );

      setSummary(filteredSummary || []);
      // setSummary(summary || []);
      setMetrics(metrics || []);
      if (metrics && metrics.length > 0) {
        setSelectedMetric(metrics[12]); // default metric
        // default is p99
      }
      setDetailData(null);
      setSelectedId(null);
      setThresholdResults([]);

      // reset table controls
      setPageSize(5);
      setSearchTerm("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Upload failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch detail for one id
  const loadDetail = async (idValue) => {
    setSelectedId(idValue);
    setDetailData(null);
    try {
      const res = await axios.get(`${API_BASE}/detail/${idValue}/`);
      setDetailData(res.data);
      console.log(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load detail for id " + idValue);
    }
  };

  // Query threshold counts
  const handleThresholdQuery = async () => {
    setErrorMsg("");
    try {
      const res = await axios.get(
        `${API_BASE}/threshold/?minutes=${thresholdMinutes}`
      );
      setThresholdResults(res.data.results || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch threshold results.");
    }
  };

  // Build data for overview bar chart
  const overviewChartData = React.useMemo(() => {
    if (!summary || summary.length === 0 || !selectedMetric) return [];
    return summary.map((row) => ({
      id: row.id,
      value: row[selectedMetric],
    }));
  }, [summary, selectedMetric]);

  // Build data for detail line chart
  const detailChartData = React.useMemo(() => {
    if (!detailData) return [];
    const { time, delta_min } = detailData;
    return time.map((t, idx) => ({
      time: t,
      delta_min: delta_min[idx],
    }));
  }, [detailData]);

  //filtered and limited summary for table
  const filteredSummary = React.useMemo(() => {
    if (!summary || summary.length === 0) return [];
    if (!searchTerm.trim()) return summary;

    const term = searchTerm.toLowerCase();
    return summary.filter((row) => String(row.id).toLowerCase().includes(term));
  }, [summary, searchTerm]);

  const visibleSummary = React.useMemo(() => {
    return filteredSummary.slice(0, pageSize);
  }, [filteredSummary, pageSize]);


  //fetch ID-threshold data for bar chart
  const handleIdThresholdQuery = async () => {
    setIdThresholdError("");
    setIdThresholdLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/id-thresholds/`);
      setIdThresholdData(res.data || []);
    } catch (err) {
      console.error(err);
      setIdThresholdError("Failed to fetch id-threshold data.");
    } finally {
      setIdThresholdLoading(false);
    }
  };


  function getColor(threshold) {
    const min = 10;
    const max = 200;

    let ratio = (threshold - min) / (max - min);
    ratio = Math.min(Math.max(ratio, 0), 1);
    const lightness = 90 - ratio * 85;
    return `hsl(0, 0%, ${lightness}%)`;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Event Gap Analyzer</h1>

      {/* Upload section */}
      <section
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>1. Upload CSV</h2>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{ marginLeft: 10 }}
        >
          {loading ? "Processing..." : "Upload & Process"}
        </button>
        {errorMsg && (
          <div style={{ color: "red", marginTop: "10px" }}>{errorMsg}</div>
        )}
      </section>


{summary && summary.length > 0 && (
  <section style={{
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  }}>
    <h2>2. Overview</h2>
    
    {/* Add the new area chart */}
    <MetricsAreaChart 
      data={summary} 
      initialMetric="p99" 
    />
    
    {/* You can keep your existing bar chart below or replace it */}
  </section>
)}

      <SummaryTable 
  data={summary}
  onRowClick={loadDetail}
  initialPageSize={5}
/>



      {/* Summary and overview chart */}
      {summary && summary.length > 0 && (
        <>
          {/* Detail view */}
          {selectedId && detailData && (
            <section
              style={{
                marginBottom: "20px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            >
              <h2>3. Detail for ID: {selectedId}</h2>
              {detailChartData.length > 0 ? (
                <LineChart
                  width={900}
                  height={300}
                  data={detailChartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="delta_min"
                    name="delta_min (minutes)"
                  />
                </LineChart>
              ) : (
                <p>No data for this id.</p>
              )}
            </section>
          )}

          {/* ID–Threshold Bar Chart */}
          <section
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h2>5. Threshold per ID (Bar Chart)</h2>

            <div style={{ marginBottom: "10px" }}>
              <button
                onClick={handleIdThresholdQuery}
                disabled={idThresholdLoading}
              >
                {idThresholdLoading ? "Loading..." : "Load Thresholds"}
              </button>
              {idThresholdError && (
                <span style={{ color: "red", marginLeft: "10px" }}>
                  {idThresholdError}
                </span>
              )}
            </div>

            {idThresholdData && idThresholdData.length > 0 ? (
              <>
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "0.85rem",
                    color: "#555",
                  }}
                >
                </div>

                <div
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "10px",
                    overflowX: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      height: "220px",
                      gap: "8px",
                    }}
                  >
                    {idThresholdData.map((row) => {
                      const maxThreshold = 200; // 10–200
                      const maxBarHeight = 180; // px, inside the 220px container
                      const thresholdVal = Number(row.threshold) || 0;

                      const barHeight = Math.max(
                        8, // minimum visible height
                        (thresholdVal / maxThreshold) * maxBarHeight
                      );

                      return (
                        <div
                          key={row.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: "30px",
                            height: "100%", 
                            justifyContent: "flex-end", // bar sticks to bottom
                          }}
                        >
                          {/* bar */}
                          <div
                            style={{
                              width: "100%",
                              height: `${barHeight}px`,
                              background: getColor(thresholdVal), // dynamic color
                              borderRadius: "4px 4px 0 0",
                              transition: "height 0.3s ease",
                            }}
                            title={`id: ${row.id}\nthreshold: ${thresholdVal}`}
                          />
                          {/* id label */}
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "0.7rem",
                              textAlign: "center",
                              whiteSpace: "nowrap", 
                              overflow: "hidden", 
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.id}
                          </div>
                          {/* threshold value */}
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#555",
                            }}
                          >
                            {thresholdVal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              !idThresholdLoading && (
                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                  No data yet. Click <strong>Load Thresholds</strong>.
                </p>
              )
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default App;

