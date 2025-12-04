import React, { useState, useMemo } from "react";

const SummaryTable = ({ 
  data, 
  onRowClick,
  initialPageSize = 5 
}) => {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Define metric groups and their display properties
  const metricGroups = {
    basic: {
      title: "Basic Stats",
      metrics: ["id", "count"],
      color: "#ddd6fe"
    },
    gaps: {
      title: "Gap Statistics",
      metrics: ["min_gap", "max_gap", "mean_gap", "median_gap", "std_gap"],
      color: "#fbcfe8"
    },
    percentiles: {
      title: "Percentiles & Counts",
      metrics: [
        "p75", "count_above_p75",
        "p90", "count_above_p90", 
        "p95", "count_above_p95",
        "p99", "count_above_p99",
        "p99.5", "count_above_p99.5"
      ],
      color: "#fce7f3"
    }
  };

  // Format column names for display
  const formatColumnName = (col) => {
    if (col === "id") return "ID";
    if (col === "count") return "Count";
    if (col.startsWith("count_above_")) {
      const percentile = col.replace("count_above_", "");
      return `>${percentile}`;
    }
    if (col.startsWith("p")) return col.toUpperCase();
    return col.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // Get background color for column based on group
  const getColumnColor = (col) => {
    for (const group of Object.values(metricGroups)) {
      if (group.metrics.includes(col)) {
        return group.color;
      }
    }
    return "#ffffff";
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter((row) => 
      String(row.id).toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const visibleData = useMemo(() => {
    return sortedData.slice(0, pageSize);
  }, [sortedData, pageSize]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Format cell value
  const formatValue = (value, col) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      // Show integers for counts and IDs
      if (col === "id" || col === "count" || col.startsWith("count_above_")) {
        return value.toFixed(0);
      }
      return value.toFixed(2);
    }
    return value;
  };

  if (!data || data.length === 0) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        marginBottom: "20px"
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
            No data available. Upload a CSV file to get started.
          </p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div style={{ 
      fontFamily: "sans-serif",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      marginBottom: "20px"
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
          📋 Summary Table
        </h3>

        {/* Controls */}
        <div style={{ 
          display: "flex", 
          gap: "20px", 
          marginBottom: "16px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <div>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.85rem"
            }}>
              Show entries:
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
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
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: "block",
              marginBottom: "6px",
              fontWeight: "600",
              color: "#374151",
              fontSize: "0.85rem"
            }}>
              Search by ID:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. 10014"
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "2px solid #e5e7eb",
                minWidth: "150px",
                fontSize: "0.9rem",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#8b5cf6"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          <div style={{ 
            marginLeft: "auto", 
            padding: "8px 16px",
            backgroundColor: "#f3e8ff",
            borderRadius: "6px",
            border: "2px solid #8b5cf630"
          }}>
            <span style={{ 
              color: "#6b7280", 
              fontSize: "0.85rem",
              fontWeight: "500"
            }}>
              Showing <strong style={{ color: "#7c3aed" }}>{visibleData.length}</strong> of{" "}
              <strong style={{ color: "#7c3aed" }}>{filteredData.length}</strong> filtered
              ({data.length} total)
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ 
          display: "flex", 
          gap: "16px", 
          fontSize: "0.85rem",
          flexWrap: "wrap"
        }}>
          {Object.entries(metricGroups).map(([key, group]) => (
            <div key={key} style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              padding: "6px 12px",
              backgroundColor: group.color,
              borderRadius: "6px",
              border: "2px solid #8b5cf620"
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                backgroundColor: group.color,
                border: "2px solid #7c3aed",
                borderRadius: "2px"
              }} />
              <span style={{ 
                color: "#374151",
                fontWeight: "600"
              }}>
                {group.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem"
          }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    style={{
                      backgroundColor: getColumnColor(col),
                      borderBottom: "3px solid #8b5cf6",
                      borderRight: "1px solid #e5e7eb",
                      textAlign: col === "id" ? "left" : "right",
                      padding: "14px 16px",
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none",
                      position: "sticky",
                      top: 0,
                      whiteSpace: "nowrap",
                      transition: "background-color 0.2s",
                      color: "#374151"
                    }}
                    title={`Click to sort by ${formatColumnName(col)}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#c4b5fd";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getColumnColor(col);
                    }}
                  >
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      justifyContent: col === "id" ? "flex-start" : "flex-end" 
                    }}>
                      {formatColumnName(col)}
                      {sortConfig.key === col && (
                        <span style={{ 
                          fontSize: "0.75rem",
                          color: "#8b5cf6",
                          fontWeight: "bold"
                        }}>
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleData.map((row, idx) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row.id)}
                  style={{
                    cursor: onRowClick ? "pointer" : "default",
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      e.currentTarget.style.backgroundColor = "#f3e8ff";
                      e.currentTarget.style.transform = "scale(1.01)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        borderRight: "1px solid #f3f4f6",
                        padding: "12px 16px",
                        textAlign: col === "id" ? "left" : "right",
                        fontFamily: col === "id" ? "inherit" : "monospace",
                        fontWeight: col === "id" ? "600" : "normal",
                        color: col === "id" ? "#7c3aed" : "#374151"
                      }}
                    >
                      {formatValue(row[col], col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      {onRowClick && (
        <div style={{
          marginTop: "16px",
          padding: "12px 18px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#6b7280",
          textAlign: "center",
          border: "2px solid #8b5cf630"
        }}>
          💡 <strong style={{ color: "#7c3aed" }}>Tip:</strong> Click any row to view detailed time gap visualization
        </div>
      )}
    </div>
  );
};

export default SummaryTable;