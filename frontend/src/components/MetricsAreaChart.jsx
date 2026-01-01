import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MetricsAreaChart = ({ data, initialMetric = "p99" }) => {
  const [selectedMetric, setSelectedMetric] = useState(initialMetric);
  const [showGrid, setShowGrid] = useState(true);
  const [chartStyle, setChartStyle] = useState("smooth");

  // Define metric metadata
  const metricInfo = {
    count: { 
      label: "Event Count", 
      color: "#3b82f6",
      gradient: ["#3b82f6", "#1e40af"],
      unit: "events"
    },
    min_gap: { 
      label: "Minimum Gap", 
      color: "#10b981",
      gradient: ["#10b981", "#047857"],
      unit: "min"
    },
    max_gap: { 
      label: "Maximum Gap", 
      color: "#ef4444",
      gradient: ["#ef4444", "#b91c1c"],
      unit: "min"
    },
    mean_gap: { 
      label: "Mean Gap", 
      color: "#8b5cf6",
      gradient: ["#8b5cf6", "#6d28d9"],
      unit: "min"
    },
    median_gap: { 
      label: "Median Gap", 
      color: "#ec4899",
      gradient: ["#ec4899", "#be185d"],
      unit: "min"
    },
    std_gap: { 
      label: "Standard Deviation", 
      color: "#f59e0b",
      gradient: ["#f59e0b", "#d97706"],
      unit: "min"
    },
    p75: { 
      label: "75th Percentile", 
      color: "#14b8a6",
      gradient: ["#14b8a6", "#0d9488"],
      unit: "min"
    },
    count_above_p75: { 
      label: "Count Above P75", 
      color: "#06b6d4",
      gradient: ["#06b6d4", "#0891b2"],
      unit: "events"
    },
    p90: { 
      label: "90th Percentile", 
      color: "#f97316",
      gradient: ["#f97316", "#ea580c"],
      unit: "min"
    },
    count_above_p90: { 
      label: "Count Above P90", 
      color: "#84cc16",
      gradient: ["#84cc16", "#65a30d"],
      unit: "events"
    },
    p95: { 
      label: "95th Percentile", 
      color: "#a855f7",
      gradient: ["#a855f7", "#9333ea"],
      unit: "min"
    },
    count_above_p95: { 
      label: "Count Above P95", 
      color: "#22c55e",
      gradient: ["#22c55e", "#16a34a"],
      unit: "events"
    },
    p99: { 
      label: "99th Percentile", 
      color: "#dc2626",
      gradient: ["#dc2626", "#991b1b"],
      unit: "min"
    },
    count_above_p99: { 
      label: "Count Above P99", 
      color: "#0ea5e9",
      gradient: ["#0ea5e9", "#0284c7"],
      unit: "events"
    },
    "p99.5": { 
      label: "99.5th Percentile", 
      color: "#e11d48",
      gradient: ["#e11d48", "#be123c"],
      unit: "min"
    },
    "count_above_p99.5": { 
      label: "Count Above P99.5", 
      color: "#6366f1",
      gradient: ["#6366f1", "#4f46e5"],
      unit: "events"
    },
  };

  // Get available metrics from data
  const availableMetrics = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(key => key !== 'id');
  }, [data]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(row => ({
      id: row.id,
      value: row[selectedMetric] || 0
    }));
  }, [data, selectedMetric]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map(d => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { avg, max, min, count: values.length };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const info = metricInfo[selectedMetric] || {};
      return (
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          padding: "12px 16px",
          border: `2px solid ${info.color}`,
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <p style={{ margin: 0, fontWeight: "600", fontSize: "0.9rem", color: "#1f2937" }}>
            ID: {payload[0].payload.id}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: info.color, fontWeight: "600" }}>
            {info.label}: {payload[0].value.toFixed(2)} {info.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: "40px", 
        textAlign: "center", 
        color: "#9ca3af",
        fontSize: "1.1rem" 
      }}>
        No data available for chart
      </div>
    );
  }

  const currentMetric = metricInfo[selectedMetric] || metricInfo.p99;

  return (
    <div style={{ 
      fontFamily: "sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ 
          margin: "0 0 16px 0", 
          color: "#1f2937",
          fontSize: "1.5rem",
          fontWeight: "700"
        }}>
          📊 Metrics Visualization
        </h3>

        {/* Controls Row */}
        <div style={{ 
          display: "flex", 
          gap: "20px", 
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          {/* Metric Selector */}
          <div style={{ flex: "1", minWidth: "250px" }}>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.9rem"
            }}>
              Select Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
                fontSize: "0.95rem",
                fontWeight: "500",
                cursor: "pointer",
                backgroundColor: "#ffffff",
                color: "#1f2937",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = currentMetric.color}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            >
              {availableMetrics.map((metric) => (
                <option key={metric} value={metric}>
                  {metricInfo[metric]?.label || metric}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Style */}
          <div>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.9rem"
            }}>
              Curve Style
            </label>
            <select
              value={chartStyle}
              onChange={(e) => setChartStyle(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
                fontSize: "0.95rem",
                cursor: "pointer",
                backgroundColor: "#ffffff"
              }}
            >
              <option value="smooth">Smooth</option>
              <option value="linear">Linear</option>
              <option value="step">Step</option>
            </select>
          </div>

          {/* Grid Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "24px" }}>
            <input
              type="checkbox"
              id="gridToggle"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <label 
              htmlFor="gridToggle" 
              style={{ 
                cursor: "pointer", 
                fontWeight: "500",
                color: "#374151",
                fontSize: "0.9rem"
              }}
            >
              Show Grid
            </label>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            marginTop: "16px",
            flexWrap: "wrap"
          }}>
            {[
              { label: "Average", value: stats.avg },
              { label: "Maximum", value: stats.max },
              { label: "Minimum", value: stats.min },
              { label: "IDs", value: stats.count, noUnit: true }
            ].map((stat, idx) => (
              <div 
                key={idx}
                style={{
                  flex: "1",
                  minWidth: "120px",
                  padding: "12px 16px",
                  background: `linear-gradient(135deg, ${currentMetric.gradient[0]}15, ${currentMetric.gradient[1]}25)`,
                  borderRadius: "8px",
                  border: `2px solid ${currentMetric.color}30`
                }}
              >
                <div style={{ 
                  fontSize: "0.75rem", 
                  color: "#6b7280",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "4px"
                }}>
                  {stat.label}
                </div>
                <div style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "700",
                  color: currentMetric.color,
                  fontFamily: "monospace"
                }}>
                  {stat.noUnit ? stat.value : `${stat.value.toFixed(2)} ${currentMetric.unit}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
      }}>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
          >
            <defs>
              <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentMetric.gradient[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={currentMetric.gradient[1]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                strokeOpacity={0.6}
              />
            )}
            <XAxis 
              dataKey="id" 
              stroke="#6b7280"
              style={{ fontSize: "0.85rem", fontWeight: "500" }}
              label={{ 
                value: 'ID', 
                position: 'insideBottom', 
                offset: -10,
                style: { fontSize: "0.95rem", fontWeight: "600", fill: "#374151" }
              }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: "0.85rem", fontWeight: "500" }}
              label={{ 
                value: `${currentMetric.label} (${currentMetric.unit})`, 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: "0.95rem", fontWeight: "600", fill: "#374151" }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                paddingTop: "20px",
                fontSize: "0.95rem",
                fontWeight: "600"
              }}
            />
            <Area
              type={chartStyle === "smooth" ? "monotone" : chartStyle}
              dataKey="value"
              name={currentMetric.label}
              stroke={currentMetric.color}
              strokeWidth={3}
              fill={`url(#gradient-${selectedMetric})`}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: "16px",
        padding: "12px 16px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: "8px",
        fontSize: "0.85rem",
        color: "#4b5563",
        textAlign: "center",
        fontStyle: "italic"
      }}>
        Displaying <strong style={{ color: currentMetric.color }}>{currentMetric.label}</strong> across {chartData.length} IDs
      </div>
    </div>
  );
};

export default MetricsAreaChart;