import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const DetailLineChart = ({ 
  selectedId, 
  detailData,
  onClose
}) => {
  const [chartType, setChartType] = useState("line"); // "line" or "area"
  const [showGrid, setShowGrid] = useState(true);
  const [showAvgLine, setShowAvgLine] = useState(true);
  const [curveType, setCurveType] = useState("monotone"); // "monotone", "linear", "step"

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!detailData || !detailData.time || !detailData.delta_min) return [];
    return detailData.time.map((t, idx) => ({
      time: t,
      delta_min: detailData.delta_min[idx],
    }));
  }, [detailData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map(d => d.delta_min);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return { avg, max, min, median, count: values.length };
  }, [chartData]);

  // Find anomalies (values above 2 standard deviations)
  const anomalies = useMemo(() => {
    if (!stats || chartData.length === 0) return [];
    const values = chartData.map(d => d.delta_min);
    const mean = stats.avg;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + (2 * stdDev);
    
    return chartData.filter(d => d.delta_min > threshold);
  }, [chartData, stats]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isAnomaly = anomalies.some(a => a.time === data.time);
      
      return (
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          padding: "14px 18px",
          border: `3px solid ${isAnomaly ? "#ef4444" : "#8b5cf6"}`,
          borderRadius: "10px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.2)"
        }}>
          <p style={{ 
            margin: 0, 
            fontWeight: "600", 
            fontSize: "0.85rem", 
            color: "#6b7280",
            marginBottom: "4px"
          }}>
            Time: {data.time}
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: "1.1rem", 
            color: isAnomaly ? "#ef4444" : "#8b5cf6", 
            fontWeight: "700",
            fontFamily: "monospace"
          }}>
            {data.delta_min.toFixed(2)} minutes
          </p>
          {isAnomaly && (
            <p style={{
              margin: "4px 0 0 0",
              fontSize: "0.75rem",
              color: "#ef4444",
              fontWeight: "600"
            }}>
              ⚠️ Anomaly Detected
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!detailData || chartData.length === 0) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          color: "#6b7280"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
          <p style={{ fontSize: "1.1rem", fontWeight: "500", margin: 0 }}>
            No data available for ID: {selectedId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      position: "relative"
    }}>
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            color: "#6b7280",
            fontSize: "1.2rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transition: "all 0.2s",
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#ef4444";
            e.target.style.color = "white";
            e.target.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
            e.target.style.color = "#6b7280";
            e.target.style.transform = "scale(1)";
          }}
          title="Close detail view"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <h3 style={{ 
            margin: 0, 
            color: "#1f2937",
            fontSize: "1.5rem",
            fontWeight: "700"
          }}>
            🔍 Detail View
          </h3>
          <div style={{
            padding: "6px 16px",
            backgroundColor: "#f3e8ff",
            borderRadius: "20px",
            border: "2px solid #8b5cf6"
          }}>
            <span style={{ 
              fontWeight: "700", 
              color: "#7c3aed",
              fontSize: "1.1rem"
            }}>
              ID: {selectedId}
            </span>
          </div>
        </div>

        {/* Controls Row */}
        <div style={{ 
          display: "flex", 
          gap: "16px", 
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          {/* Chart Type */}
          <div>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.85rem"
            }}>
              Chart Type
            </label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "2px solid #e5e7eb",
                fontSize: "0.9rem",
                cursor: "pointer",
                backgroundColor: "#ffffff",
                fontWeight: "500"
              }}
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>

          {/* Curve Type */}
          <div>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.85rem"
            }}>
              Curve Style
            </label>
            <select
              value={curveType}
              onChange={(e) => setCurveType(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "2px solid #e5e7eb",
                fontSize: "0.9rem",
                cursor: "pointer",
                backgroundColor: "#ffffff",
                fontWeight: "500"
              }}
            >
              <option value="monotone">Smooth</option>
              <option value="linear">Linear</option>
              <option value="step">Step</option>
            </select>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: "16px", paddingTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="avgToggle"
                checked={showAvgLine}
                onChange={(e) => setShowAvgLine(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label 
                htmlFor="avgToggle" 
                style={{ 
                  cursor: "pointer", 
                  fontWeight: "500",
                  color: "#374151",
                  fontSize: "0.9rem"
                }}
              >
                Show Average
              </label>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div style={{ 
            display: "flex", 
            gap: "12px", 
            flexWrap: "wrap"
          }}>
            {[
              { label: "Average", value: stats.avg, icon: "📊", color: "#8b5cf6" },
              { label: "Median", value: stats.median, icon: "📈", color: "#06b6d4" },
              { label: "Maximum", value: stats.max, icon: "⬆️", color: "#ef4444" },
              { label: "Minimum", value: stats.min, icon: "⬇️", color: "#10b981" },
              { label: "Data Points", value: stats.count, icon: "🔢", color: "#f59e0b", noUnit: true },
              { label: "Anomalies", value: anomalies.length, icon: "⚠️", color: "#dc2626", noUnit: true }
            ].map((stat, idx) => (
              <div 
                key={idx}
                style={{
                  flex: "1",
                  minWidth: "110px",
                  padding: "10px 14px",
                  background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}25)`,
                  borderRadius: "8px",
                  border: `2px solid ${stat.color}30`
                }}
              >
                <div style={{ 
                  fontSize: "0.7rem", 
                  color: "#6b7280",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "2px"
                }}>
                  {stat.icon} {stat.label}
                </div>
                <div style={{ 
                  fontSize: "1.05rem", 
                  fontWeight: "700",
                  color: stat.color,
                  fontFamily: "monospace"
                }}>
                  {stat.noUnit ? stat.value : `${stat.value.toFixed(2)} min`}
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
        <ResponsiveContainer width="100%" height={450}>
          {chartType === "line" ? (
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.9}/>
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
                dataKey="time" 
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: "0.75rem", fontWeight: "500" }}
                label={{ 
                  value: 'Time', 
                  position: 'insideBottom', 
                  offset: -45,
                  style: { fontSize: "0.95rem", fontWeight: "600", fill: "#374151" }
                }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: "0.85rem", fontWeight: "500" }}
                label={{ 
                  value: 'Gap (minutes)', 
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
              {showAvgLine && stats && (
                <ReferenceLine 
                  y={stats.avg} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: `Avg: ${stats.avg.toFixed(2)}`, 
                    fill: "#f59e0b", 
                    fontSize: 12,
                    fontWeight: "bold"
                  }}
                />
              )}
              <Line
                type={curveType}
                dataKey="delta_min"
                name="Time Gap (minutes)"
                stroke="url(#lineGradient)"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", r: 4 }}
                activeDot={{ r: 6, fill: "#ec4899" }}
                animationDuration={1000}
              />
            </LineChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
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
                dataKey="time" 
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
                style={{ fontSize: "0.75rem", fontWeight: "500" }}
                label={{ 
                  value: 'Time', 
                  position: 'insideBottom', 
                  offset: -45,
                  style: { fontSize: "0.95rem", fontWeight: "600", fill: "#374151" }
                }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: "0.85rem", fontWeight: "500" }}
                label={{ 
                  value: 'Gap (minutes)', 
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
              {showAvgLine && stats && (
                <ReferenceLine 
                  y={stats.avg} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ 
                    value: `Avg: ${stats.avg.toFixed(2)}`, 
                    fill: "#f59e0b", 
                    fontSize: 12,
                    fontWeight: "bold"
                  }}
                />
              )}
              <Area
                type={curveType}
                dataKey="delta_min"
                name="Time Gap (minutes)"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#areaGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: "16px",
        padding: "14px 18px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>
          <strong style={{ color: "#8b5cf6" }}>{chartData.length}</strong> data points analyzed
        </div>
        {anomalies.length > 0 && (
          <div style={{
            padding: "6px 14px",
            backgroundColor: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: "600",
            color: "#dc2626"
          }}>
            ⚠️ {anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'} detected
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailLineChart;