# Log Source Management Visualization

A Python-based data analysis and visualization pipeline for **log source / client activity monitoring**.  
The project analyzes time-series event data, detects anomalous gaps in activity, removes outliers, and generates **summary and diagnostic visualizations** to support operational monitoring and anomaly detection.

---

## 📌 Overview

This repository provides an **end-to-end log source analysis pipeline** that:

- Computes **inter-event time gaps** per log source (ID)  
- Outlier removal using **Interquartile Range (IQR) filtering**
- Detects **large inactivity gaps** beyond a configurable threshold  
- Produces **summary statistics and visual insights**  
- **Time-series preprocessing** and cleaning
<!-- - Detection of inactivity gaps exceeding configurable thresholds -->
- Summary **statistics generation**
- Automated **visualization of metrics and distributions**


This is especially useful for:
- Quantify update intervals per log source
- Detect abnormal inactivity gaps
- Summarize log source behavior
- Visualize patterns for rapid inspection
- Log source health monitoring  
- Client heartbeat / update interval analysis  
- Anomaly detection in SIEM-style event streams  

---



---

## 📊 Visual Outputs

The pipeline generates multiple visualizations to help interpret log source behavior:

- **Landing Overview** – High-level activity distribution  
- **Metric View** – Inter-event gap statistics  
- **Summary Table** – Per-ID aggregate metrics  
- **Threshold Analysis** – Gaps exceeding inactivity thresholds  
- **Detailed View** – Per-log-source diagnostics  

Example outputs:

![Landing](resource/LandingTop.png)  
![Metrics](resource/Metric.png)  
![Summary](resource/SummaryTable.png)  
![Threshold](resource/Threshold.png)  
![Details](resource/Detail.png)

---

## ⚙️ Core Pipeline Logic

The analysis pipeline performs the following steps:

1. **Data Loading**
   - Reads CSV files with columns:
     ```
     time, count, id
     ```

2. **Preprocessing**
   - Converts timestamps to datetime
   - Sorts events per log source
   - Computes inter-arrival time gaps (in minutes)

3. **Outlier Removal**
   - Uses **Interquartile Range (IQR)** filtering
   - Removes abnormal gaps that skew statistics

4. **Gap Analysis**
   - Calculates:
     - Mean gap
     - Median gap
     - Max gap
     - Event counts per source

5. **Threshold Detection**
   - Flags gaps exceeding a user-defined inactivity threshold
   - Useful for identifying silent or failing log sources

---

## 📈 Output Data

The pipeline produces the following outputs:

- **Cleaned dataset**  
  Preprocessed event data with standardized timestamps and computed inter-event gaps.

- **IQR-filtered dataset**  
  Dataset after removing statistical outliers using Interquartile Range (IQR) filtering to ensure robust gap analysis.

- **Per-ID summary table**  
  Aggregated statistics for each log source, including event count, mean gap, median gap, and maximum gap.

- **Inactivity gap list**  
  Identified inter-event gaps that exceed the configured inactivity threshold, highlighting potential log source failures or delays.

These outputs can be further integrated into:

- **Dashboards** for real-time or batch monitoring  
- **SIEM tools** for ingestion reliability and alerting  
- **ML/LLM-based anomaly detection pipelines** for advanced analytics and automated reasoning


<!-- # Log Source Management Visualization

![Chart](resource/LandingTop.png)

![Chart](resource/Metric.png)

![Chart](resource/SummaryTable.png)

![Chart](resource/Threshold.png)

![Chart](resource/Detail.png) -->
