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
      color: "#f0f9ff"
    },
    gaps: {
      title: "Gap Statistics",
      metrics: ["min_gap", "max_gap", "mean_gap", "median_gap", "std_gap"],
      color: "#fefce8"
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
      color: "#fef2f2"
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
    return <div style={{ padding: "20px", color: "#666" }}>No data available</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* Controls */}
      <div style={{ 
        display: "flex", 
        gap: "20px", 
        marginBottom: "16px",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <div>
          <label style={{ marginRight: "8px", fontWeight: "500" }}>
            Show entries:
          </label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            style={{
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid #d1d5db"
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
          <label style={{ marginRight: "8px", fontWeight: "500" }}>
            Search by ID:
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. 10014"
            style={{
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              minWidth: "150px"
            }}
          />
        </div>

        <div style={{ marginLeft: "auto", color: "#6b7280", fontSize: "0.9rem" }}>
          Showing {visibleData.length} of {filteredData.length} filtered 
          ({data.length} total)
        </div>
      </div>

      {/* Legend */}
      <div style={{ 
        display: "flex", 
        gap: "16px", 
        marginBottom: "12px",
        fontSize: "0.85rem",
        flexWrap: "wrap"
      }}>
        {Object.entries(metricGroups).map(([key, group]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "16px",
              height: "16px",
              backgroundColor: group.color,
              border: "1px solid #e5e7eb",
              borderRadius: "2px"
            }} />
            <span style={{ color: "#374151" }}>{group.title}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ 
        overflowX: "auto", 
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
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
                    borderBottom: "2px solid #d1d5db",
                    borderRight: "1px solid #e5e7eb",
                    textAlign: col === "id" ? "left" : "right",
                    padding: "12px 16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    userSelect: "none",
                    position: "sticky",
                    top: 0,
                    whiteSpace: "nowrap"
                  }}
                  title={`Click to sort by ${formatColumnName(col)}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: col === "id" ? "flex-start" : "flex-end" }}>
                    {formatColumnName(col)}
                    {sortConfig.key === col && (
                      <span style={{ fontSize: "0.75rem" }}>
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
                  transition: "background-color 0.15s"
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      borderRight: "1px solid #f3f4f6",
                      padding: "10px 16px",
                      textAlign: col === "id" ? "left" : "right",
                      fontFamily: col === "id" ? "inherit" : "monospace",
                      fontWeight: col === "id" ? "500" : "normal"
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

      {onRowClick && (
        <p style={{ 
          marginTop: "12px", 
          fontSize: "0.85rem", 
          color: "#6b7280",
          fontStyle: "italic"
        }}>
          💡 Click any row to view detailed visualization
        </p>
      )}
    </div>
  );
};

export default SummaryTable;