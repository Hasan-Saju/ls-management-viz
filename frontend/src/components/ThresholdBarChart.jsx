import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ThresholdBarChart = ({ 
  data, 
  onLoadData,
  loading = false,
  error = ""
}) => {
  const [viewMode, setViewMode] = useState("bars"); // "bars" or "chart"
  const [sortBy, setSortBy] = useState("id"); // "id", "threshold-asc", "threshold-desc"
  const [colorScheme, setColorScheme] = useState("gradient"); // "gradient", "heatmap", "category"

  // Sort data based on selection
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sorted = [...data];
    if (sortBy === "threshold-asc") {
      sorted.sort((a, b) => a.threshold - b.threshold);
    } else if (sortBy === "threshold-desc") {
      sorted.sort((a, b) => b.threshold - a.threshold);
    } else {
      // sort by id
      sorted.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }
    return sorted;
  }, [data, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const thresholds = data.map(d => d.threshold);
    const sum = thresholds.reduce((a, b) => a + b, 0);
    const avg = sum / thresholds.length;
    const max = Math.max(...thresholds);
    const min = Math.min(...thresholds);
    return { avg, max, min, count: thresholds.length };
  }, [data]);

  // Color functions for different schemes
  const getColor = (threshold, scheme = "gradient") => {
    const min = 10;
    const max = 200;
    let ratio = (threshold - min) / (max - min);
    ratio = Math.min(Math.max(ratio, 0), 1);

    if (scheme === "gradient") {
      // Purple to pink gradient
      const hue = 280 - (ratio * 60); // 280 (purple) to 220 (pink)
      const saturation = 70 + (ratio * 20); // 70% to 90%
      const lightness = 60 - (ratio * 25); // 60% to 35%
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    } else if (scheme === "heatmap") {
      // Green to yellow to red heatmap
      if (ratio < 0.5) {
        const localRatio = ratio * 2;
        return `rgb(${Math.round(localRatio * 255)}, 200, ${Math.round((1 - localRatio) * 100)})`;
      } else {
        const localRatio = (ratio - 0.5) * 2;
        return `rgb(255, ${Math.round((1 - localRatio) * 200)}, 0)`;
      }
    } else {
      // Category-based colors
      if (threshold < 50) return "#10b981"; // green
      if (threshold < 100) return "#f59e0b"; // yellow
      if (threshold < 150) return "#f97316"; // orange
      return "#ef4444"; // red
    }
  };

  // Custom tooltip for recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          padding: "12px 16px",
          border: `2px solid ${getColor(data.threshold, colorScheme)}`,
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <p style={{ margin: 0, fontWeight: "600", fontSize: "0.9rem", color: "#1f2937" }}>
            ID: {data.id}
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.95rem", color: getColor(data.threshold, colorScheme), fontWeight: "700" }}>
            Threshold: {data.threshold} min
          </p>
        </div>
      );
    }
    return null;
  };

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
          ⏱️ Threshold per ID
        </h3>

        {/* Controls Row */}
        <div style={{ 
          display: "flex", 
          gap: "16px", 
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          {/* Load Button */}
          <button
            onClick={onLoadData}
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: loading ? "#9ca3af" : "#8b5cf6",
              color: "white",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 2px 8px rgba(139, 92, 246, 0.3)",
              transition: "all 0.2s",
              transform: loading ? "none" : "translateY(0)"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#7c3aed";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#8b5cf6";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 8px rgba(139, 92, 246, 0.3)";
              }
            }}
          >
            {loading ? "⏳ Loading..." : "📊 Load Thresholds"}
          </button>

          {error && (
            <span style={{ 
              color: "#ef4444", 
              fontWeight: "500",
              fontSize: "0.9rem"
            }}>
              ⚠️ {error}
            </span>
          )}

          {data && data.length > 0 && (
            <>
              {/* View Mode Toggle */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setViewMode("bars")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: viewMode === "bars" ? "2px solid #8b5cf6" : "2px solid #e5e7eb",
                    backgroundColor: viewMode === "bars" ? "#f3e8ff" : "white",
                    color: viewMode === "bars" ? "#7c3aed" : "#6b7280",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Custom Bars
                </button>
                <button
                  onClick={() => setViewMode("chart")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: viewMode === "chart" ? "2px solid #8b5cf6" : "2px solid #e5e7eb",
                    backgroundColor: viewMode === "chart" ? "#f3e8ff" : "white",
                    color: viewMode === "chart" ? "#7c3aed" : "#6b7280",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Bar Chart
                </button>
              </div>
            </>
          )}
        </div>

        {/* Additional Controls */}
        {data && data.length > 0 && (
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            {/* Sort By */}
            <div>
              <label style={{ 
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
                color: "#374151",
                fontSize: "0.85rem"
              }}>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
                <option value="id">ID</option>
                <option value="threshold-asc">Threshold (Low to High)</option>
                <option value="threshold-desc">Threshold (High to Low)</option>
              </select>
            </div>

            {/* Color Scheme */}
            <div>
              <label style={{ 
                display: "block",
                marginBottom: "6px",
                fontWeight: "600",
                color: "#374151",
                fontSize: "0.85rem"
              }}>
                Color Scheme
              </label>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
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
                <option value="gradient">Purple Gradient</option>
                <option value="heatmap">Heatmap</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {stats && (
          <div style={{ 
            display: "flex", 
            gap: "16px", 
            marginTop: "16px",
            flexWrap: "wrap"
          }}>
            {[
              { label: "Average", value: stats.avg, icon: "📊" },
              { label: "Maximum", value: stats.max, icon: "⬆️" },
              { label: "Minimum", value: stats.min, icon: "⬇️" },
              { label: "Total IDs", value: stats.count, icon: "🔢", noUnit: true }
            ].map((stat, idx) => (
              <div 
                key={idx}
                style={{
                  flex: "1",
                  minWidth: "120px",
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, #8b5cf615, #7c3aed25)",
                  borderRadius: "8px",
                  border: "2px solid #8b5cf630"
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
                  {stat.icon} {stat.label}
                </div>
                <div style={{ 
                  fontSize: "1.25rem", 
                  fontWeight: "700",
                  color: "#7c3aed",
                  fontFamily: "monospace"
                }}>
                  {stat.noUnit ? stat.value : `${stat.value.toFixed(1)} min`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visualization Area */}
      {data && data.length > 0 ? (
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
        }}>
          {viewMode === "bars" ? (
            // Custom Bars View
            <div style={{
              overflowX: "auto",
              overflowY: "hidden"
            }}>
              <div style={{
                display: "flex",
                alignItems: "flex-end",
                minHeight: "300px",
                gap: "8px",
                padding: "20px 10px"
              }}>
                {sortedData.map((row) => {
                  const maxThreshold = 200;
                  const maxBarHeight = 250;
                  const thresholdVal = Number(row.threshold) || 0;
                  const barHeight = Math.max(
                    12,
                    (thresholdVal / maxThreshold) * maxBarHeight
                  );
                  
                  return (
                    <div
                      key={row.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minWidth: "40px",
                        flex: "0 0 auto"
                      }}
                    >
                      {/* Threshold value on top */}
                      <div style={{
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "4px",
                        minHeight: "18px"
                      }}>
                        {thresholdVal}
                      </div>
                      
                      {/* Bar */}
                      <div
                        style={{
                          width: "100%",
                          height: `${barHeight}px`,
                          background: getColor(thresholdVal, colorScheme),
                          borderRadius: "6px 6px 0 0",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          position: "relative"
                        }}
                        title={`ID: ${row.id}\nThreshold: ${thresholdVal} min`}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                        }}
                      />
                      
                      {/* ID label */}
                      <div style={{
                        marginTop: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "50px"
                      }}>
                        {row.id}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Recharts Bar Chart View
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={sortedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} />
                <XAxis 
                  dataKey="id" 
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  style={{ fontSize: "0.75rem", fontWeight: "500" }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: "0.85rem", fontWeight: "500" }}
                  label={{ 
                    value: 'Threshold (minutes)', 
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
                <Bar 
                  dataKey="threshold" 
                  name="Threshold (min)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                >
                  {sortedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getColor(entry.threshold, colorScheme)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        !loading && (
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "40px",
            borderRadius: "12px",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
            <p style={{ fontSize: "1.1rem", fontWeight: "500", margin: 0 }}>
              No data yet. Click <strong style={{ color: "#8b5cf6" }}>Load Thresholds</strong> to get started.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default ThresholdBarChart;