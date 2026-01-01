import React, { useState } from "react";

const UploadCSV = ({ 
  onUpload,
  loading = false,
  error = ""
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile && onUpload) {
      onUpload(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
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
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ 
          margin: "0 0 8px 0", 
          color: "#1f2937",
          fontSize: "1.5rem",
          fontWeight: "700"
        }}>
          📤 Upload CSV File
        </h3>
        <p style={{
          margin: "0 0 20px 0",
          color: "#6b7280",
          fontSize: "0.9rem"
        }}>
          Upload your event data CSV file to begin analysis
        </p>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            border: dragActive 
              ? "3px dashed #8b5cf6" 
              : selectedFile 
                ? "3px solid #10b981"
                : "3px dashed #d1d5db",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            backgroundColor: dragActive 
              ? "#f3e8ff" 
              : selectedFile
                ? "#ecfdf5"
                : "#f9fafb",
            transition: "all 0.3s ease",
            cursor: "pointer",
            position: "relative"
          }}
          onClick={() => !selectedFile && document.getElementById('fileInput').click()}
        >
          {selectedFile ? (
            // File Selected View
            <div>
              <div style={{
                fontSize: "3rem",
                marginBottom: "12px"
              }}>
                ✅
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap"
              }}>
                <div style={{
                  backgroundColor: "white",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "2px solid #10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{
                    fontSize: "1.5rem"
                  }}>
                    📄
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{
                      fontWeight: "600",
                      color: "#1f2937",
                      fontSize: "0.95rem",
                      marginBottom: "2px"
                    }}>
                      {selectedFile.name}
                    </div>
                    <div style={{
                      fontSize: "0.8rem",
                      color: "#6b7280"
                    }}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      fontSize: "1.1rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#dc2626";
                      e.target.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#fee2e2";
                      e.target.style.color = "#dc2626";
                    }}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              </div>
              <p style={{
                marginTop: "16px",
                color: "#059669",
                fontSize: "0.9rem",
                fontWeight: "500"
              }}>
                File ready to upload!
              </p>
            </div>
          ) : (
            // Empty State View
            <div>
              <div style={{
                fontSize: "3.5rem",
                marginBottom: "16px",
                opacity: dragActive ? 1 : 0.6
              }}>
                {dragActive ? "📂" : "📁"}
              </div>
              <p style={{
                margin: "0 0 12px 0",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#1f2937"
              }}>
                {dragActive ? "Drop your file here" : "Drag & drop your CSV file here"}
              </p>
              <p style={{
                margin: "0 0 16px 0",
                fontSize: "0.9rem",
                color: "#6b7280"
              }}>
                or
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('fileInput').click();
                }}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "2px solid #8b5cf6",
                  backgroundColor: "white",
                  color: "#8b5cf6",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#8b5cf6";
                  e.target.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "white";
                  e.target.style.color = "#8b5cf6";
                }}
              >
                Browse Files
              </button>
              <p style={{
                marginTop: "16px",
                fontSize: "0.8rem",
                color: "#9ca3af"
              }}>
                Supported format: CSV files only
              </p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            id="fileInput"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Upload Button */}
        {selectedFile && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={handleUploadClick}
              disabled={loading || !selectedFile}
              style={{
                padding: "12px 32px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: loading ? "#9ca3af" : "#8b5cf6",
                color: "white",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 12px rgba(139, 92, 246, 0.4)",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#7c3aed";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(139, 92, 246, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = "#8b5cf6";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(139, 92, 246, 0.4)";
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "3px solid #ffffff40",
                    borderTopColor: "#ffffff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <span style={{ fontSize: "1.2rem" }}>🚀</span>
                  Upload & Process
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            border: "2px solid #ef4444",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <span style={{
              color: "#dc2626",
              fontWeight: "500",
              fontSize: "0.9rem"
            }}>
              {error}
            </span>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          marginTop: "20px",
          padding: "14px 18px",
          backgroundColor: "#eff6ff",
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#1e40af"
        }}>
          <div style={{ fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1rem" }}>💡</span>
            Quick Tips:
          </div>
          <ul style={{ margin: "0", paddingLeft: "20px" }}>
            <li>Ensure your CSV has the required columns (id, timestamp)</li>
            <li>File size should be reasonable for browser processing</li>
            <li>Data will be analyzed for time gaps between events</li>
          </ul>
        </div>
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UploadCSV;