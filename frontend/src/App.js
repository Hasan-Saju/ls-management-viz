// src/App.js
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
  // NEW: state for ID-threshold bar chart
  const [idThresholdData, setIdThresholdData] = React.useState([]);
  const [idThresholdError, setIdThresholdError] = React.useState("");
  const [idThresholdLoading, setIdThresholdLoading] = React.useState(false);

  // NEW: table controls
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

  // NEW: filtered + limited summary for table
  const filteredSummary = React.useMemo(() => {
    if (!summary || summary.length === 0) return [];
    if (!searchTerm.trim()) return summary;

    const term = searchTerm.toLowerCase();
    return summary.filter((row) => String(row.id).toLowerCase().includes(term));
  }, [summary, searchTerm]);

  const visibleSummary = React.useMemo(() => {
    return filteredSummary.slice(0, pageSize);
  }, [filteredSummary, pageSize]);

  // NEW: fetch ID-threshold data for bar chart
  const handleIdThresholdQuery = async () => {
    setIdThresholdError("");
    setIdThresholdLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/id-thresholds/`);
      // Django returns a list: [{ id: "A12", threshold: 30 }, ...]
      setIdThresholdData(res.data || []);
    } catch (err) {
      console.error(err);
      setIdThresholdError("Failed to fetch id-threshold data.");
    } finally {
      setIdThresholdLoading(false);
    }
  };

  // threshold: number (0–200)

  function getColor(threshold) {
    const min = 10;
    const max = 200;

    // Normalize value: 0 (low) → 1 (high)
    let ratio = (threshold - min) / (max - min);
    ratio = Math.min(Math.max(ratio, 0), 1);

    // Lightness: 90% (light gray) → 5% (almost black)
    const lightness = 90 - ratio * 85;

    // hsl(0, 0%, L%) = grayscale
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

      {/* Summary + overview chart */}
      {summary && summary.length > 0 && (
        <>
          <section
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h2>2. Overview</h2>

            {/* Metric selector */}
            <div
              style={{
                marginBottom: "10px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <div>
                <label>Select overview metric: </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metrics.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bar chart */}
            {overviewChartData.length > 0 && (
              <BarChart
                width={1200}
                height={400}
                data={overviewChartData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                barCategoryGap="20%" // auto gap between each bar
                barGap="5%" // auto gap if multiple bars exist
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="value"
                  name={selectedMetric}
                  barSize={30}
                  maxBarSize={50}
                />
              </BarChart>
            )}

            <div
              style={{
                marginBottom: "10px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              {/* NEW: table controls */}
              <div>
                <label style={{ marginRight: 8 }}>Show entries:</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>

              <div>
                <label style={{ marginRight: 8 }}>Search by ID:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. 10014"
                  style={{ padding: "4px 8px" }}
                />
              </div>
            </div>

            {/* Summary table */}
            <h3 style={{ marginTop: "20px" }}>Summary Table</h3>
            <p style={{ fontSize: "0.85rem", color: "#555" }}>
              Showing {visibleSummary.length} of {filteredSummary.length}{" "}
              filtered rows (total {summary.length}).
            </p>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr>
                  {Object.keys(summary[0]).map((col) => (
                    <th
                      key={col}
                      style={{
                        borderBottom: "1px solid #ccc",
                        textAlign: "left",
                        padding: "4px",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleSummary.map((row) => (
                  <tr
                    key={row.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => loadDetail(row.id)}
                  >
                    {Object.keys(row).map((col) => (
                      <td
                        key={col}
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px",
                        }}
                      >
                        {Array.isArray(row[col])
                          ? row[col]
                              .map((v) =>
                                typeof v === "number" ? v.toFixed(2) : v
                              )
                              .join(", ")
                          : typeof row[col] === "number"
                          ? row[col].toFixed(2)
                          : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ marginTop: "10px" }}>
              Click a row to see detailed visualization for that id.
            </p>
          </section>

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

          {/* Threshold query
          <section
            style={{
              marginBottom: "20px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h2>4. Events after X minutes</h2>
            <div style={{ marginBottom: "10px" }}>
              <label>Threshold (minutes): </label>
              <input
                type="number"
                value={thresholdMinutes}
                onChange={(e) => setThresholdMinutes(e.target.value)}
                style={{ width: "100px", marginRight: "10px" }}
              />
              <button onClick={handleThresholdQuery}>Query</button>
            </div>

            {thresholdResults && thresholdResults.length > 0 && (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        borderBottom: "1px solid #ccc",
                        textAlign: "left",
                        padding: "4px",
                      }}
                    >
                      id
                    </th>
                    <th
                      style={{
                        borderBottom: "1px solid #ccc",
                        textAlign: "left",
                        padding: "4px",
                      }}
                    >
                      count_above_threshold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {thresholdResults.map((row) => (
                    <tr key={row.id}>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px",
                        }}
                      >
                        {row.id}
                      </td>
                      <td
                        style={{
                          borderBottom: "1px solid #eee",
                          padding: "4px",
                        }}
                      >
                        {row.count_above_threshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section> */}

          {/* Threshold–ID Bar Chart */}
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
                  {/* X-axis: <strong>id</strong>, Y-axis:{" "}
                  <strong>threshold (minutes)</strong> */}
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
                            height: "100%", // take full chart area height
                            justifyContent: "flex-end", // bar sticks to bottom
                          }}
                        >
                          {/* bar */}
                          <div
                            style={{
                              width: "100%",
                              height: `${barHeight}px`,
                              background: getColor(thresholdVal), // ← dynamic color
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
                              whiteSpace: "nowrap", // ⬅️ keep whole id on one line
                              overflow: "hidden", // ⬅️ if it's too long, hide the overflow
                              textOverflow: "ellipsis", // ⬅️ show "..." if it's too long
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
