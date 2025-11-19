import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, Any, List, Tuple


# =========================
# 1. DATA LOADING & PREP
# =========================

def load_data(csv_path: str) -> pd.DataFrame:
    """
    Load raw CSV data.
    Expected columns: time, count, id
    """
    df = pd.read_csv(csv_path)
    return df


def add_time_and_delta(df: pd.DataFrame, base_gap_min: float = 10.0) -> pd.DataFrame:
    """
    - Parse time column to datetime.
    - Sort by (id, time).
    - Compute delta_min per id.
    - Subtract base_gap_min (e.g., 10 minutes).
    - Remove zeros and NaNs in delta_min.
    """
    df = df.copy()
    df['time'] = pd.to_datetime(df['time'])

    # Sort by id + time
    df = df.sort_values(['id', 'time'])

    # Compute time differences in minutes
    df['delta_min'] = df.groupby('id')['time'].diff().dt.total_seconds() / 60.0

    # Subtract base period (your 10-minute sampling interval)
    df['delta_min'] = df['delta_min'] - base_gap_min

    # Remove exact zeros
    df = df[df['delta_min'] != 0]

    # Drop rows where delta_min is NaN (first row per id)
    df_clean = df.dropna(subset=['delta_min']).copy()

    return df_clean


# =========================
# 2. OUTLIER REMOVAL
# =========================

def remove_high_outliers_iqr(df: pd.DataFrame,
                             value_col: str = 'delta_min',
                             group_col: str = 'id') -> pd.DataFrame:
    """
    Remove high outliers per id based on IQR rule:
        keep values <= Q3 + 1.5 * IQR
    """
    def iqr_filter(sub_df: pd.DataFrame) -> pd.DataFrame:
        Q1 = sub_df[value_col].quantile(0.25)
        Q3 = sub_df[value_col].quantile(0.75)
        IQR = Q3 - Q1
        upper = Q3 + 1.5 * IQR
        return sub_df[sub_df[value_col] <= upper]

    df_filtered = df.groupby(group_col, group_keys=False).apply(iqr_filter)
    return df_filtered.reset_index(drop=True)


# =========================
# 3. STATS PER ID
# =========================

def gap_stats(group: pd.DataFrame) -> pd.Series:
    """
    group: rows for a single id from df_clean_removed
           columns include: time, count, id, delta_min

    Returns a Series with various stats for this id.
    """
    x = group['delta_min']

    stats: Dict[str, Any] = {}
    percentiles = [75, 90, 95, 99, 99.5]

    # --- base stats ---
    stats['count'] = len(x)
    stats['min_gap'] = x.min()
    stats['max_gap'] = x.max()
    stats['mean_gap'] = x.mean()
    stats['median_gap'] = x.median()
    stats['std_gap'] = x.std()

    # --- percentile stats + how often we're above them ---
    for p in percentiles:
        val = np.percentile(x, p)
        stats[f'p{p}'] = val
        stats[f'count_above_p{p}'] = (x > val).sum()

    # --- extreme gaps (> 99.5th percentile) ---
    p995 = stats['p99.5']
    extreme_rows = group[group['delta_min'] > p995]

    # store their times as strings so they display nicely
    stats['times'] = list(extreme_rows['time'].astype(str))

    return pd.Series(stats)


def compute_summary_stats(df_clean_removed: pd.DataFrame) -> pd.DataFrame:
    """
    Compute gap_stats for each id.
    """
    summary = (
        df_clean_removed
        .groupby('id')
        .apply(gap_stats)
        .reset_index()
    )
    return summary


# =========================
# 4. THRESHOLD-BASED COUNTS
# =========================

def gaps_above_threshold(df: pd.DataFrame,
                         threshold_min: float,
                         group_col: str = 'id',
                         value_col: str = 'delta_min') -> pd.DataFrame:
    """
    For a given threshold (e.g., 60 minutes),
    count how many events (rows) have delta_min > threshold,
    for each id.

    Returns a DataFrame:
        id, count_above_threshold, sample_times (list of timestamps)
    """
    def per_group(g: pd.DataFrame) -> pd.Series:
        mask = g[value_col] > threshold_min
        count = mask.sum()
        times = list(g.loc[mask, 'time'].astype(str))
        return pd.Series({
            'count_above_threshold': count,
            'sample_times': times,
        })

    result = (
        df.groupby(group_col)
          .apply(per_group)
          .reset_index()
    )
    return result


# =========================
# 5. VISUALIZATION HELPERS
# =========================

def plot_overview(summary: pd.DataFrame,
                  metric: str = 'mean_gap',
                  top_n: int = 50) -> None:
    """
    Overview plot:
      - Bar chart of chosen metric per id (e.g., mean_gap).
      - Shows up to top_n ids sorted by metric descending.
    """
    if metric not in summary.columns:
        raise ValueError(f"Metric '{metric}' not in summary columns: {summary.columns.tolist()}")

    # Sort and optionally take top_n
    data = summary.sort_values(metric, ascending=False).head(top_n)

    plt.figure(figsize=(12, 6))
    plt.bar(data['id'].astype(str), data[metric])
    plt.xticks(rotation=90)
    plt.xlabel('id')
    plt.ylabel(metric)
    plt.title(f'Overview: {metric} per id (top {top_n})')
    plt.tight_layout()
    plt.show()


def plot_id_detail(df_clean_removed: pd.DataFrame,
                   id_value: Any,
                   threshold_min: float = None) -> None:
    """
    Detailed visualization for one id:
      - Time series: time vs delta_min
      - Histogram of delta_min
      If threshold_min is provided, draw a horizontal line on the time series
      and a vertical line on the histogram.
    """
    sub = df_clean_removed[df_clean_removed['id'] == id_value].copy()
    if sub.empty:
        print(f"No data found for id={id_value}")
        return

    # --- Time series ---
    sub = sub.sort_values('time')

    plt.figure(figsize=(12, 4))
    plt.plot(sub['time'], sub['delta_min'], marker='o')
    if threshold_min is not None:
        plt.axhline(threshold_min, linestyle='--')
    plt.xlabel('time')
    plt.ylabel('delta_min (minutes)')
    plt.title(f'id={id_value} – delta_min over time')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

    # --- Histogram ---
    plt.figure(figsize=(8, 4))
    plt.hist(sub['delta_min'], bins=20)
    if threshold_min is not None:
        plt.axvline(threshold_min, linestyle='--')
    plt.xlabel('delta_min (minutes)')
    plt.ylabel('Frequency')
    plt.title(f'id={id_value} – distribution of delta_min')
    plt.tight_layout()
    plt.show()


# =========================
# 6. HIGH-LEVEL PIPELINE
# =========================

def run_pipeline(csv_path: str,
                 base_gap_min: float = 10.0,
                 threshold_min: float = 60.0) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Convenience function:
      1) Load data
      2) Add delta_min and clean
      3) Remove high outliers
      4) Compute summary stats
      5) Compute gaps above threshold

    Returns:
      df_clean       – after delta_min calculation & cleaning
      df_clean_iqr   – after IQR-based outlier removal
      summary        – per-id statistics
      threshold_info – per-id counts above threshold_min
    """
    # Step 1: load
    df_raw = load_data(csv_path)

    # Step 2: compute delta_min and basic cleaning
    df_clean = add_time_and_delta(df_raw, base_gap_min=base_gap_min)

    # Step 3: remove high outliers
    df_clean_iqr = remove_high_outliers_iqr(df_clean, value_col='delta_min', group_col='id')

    # Step 4: per-id summary stats
    summary = compute_summary_stats(df_clean_iqr)

    # Step 5: threshold-based counts
    threshold_info = gaps_above_threshold(df_clean_iqr, threshold_min=threshold_min,
                                          group_col='id', value_col='delta_min')

    return df_clean, df_clean_iqr, summary, threshold_info


# =========================
# 7. EXAMPLE MAIN
# =========================

if __name__ == "__main__":
    # --- Adjust these values as you like ---
    CSV_PATH = r"data/data-1m-mohawk-10m.csv"
    BASE_GAP_MIN = 10.0   # your sampling interval
    THRESHOLD_MIN = 0  # e.g., "events that come after 60 minutes"

    # Run the pipeline
    df_clean, df_clean_iqr, summary, threshold_info = run_pipeline(
        csv_path=CSV_PATH,
        base_gap_min=BASE_GAP_MIN,
        threshold_min=THRESHOLD_MIN,
    )

    print("=== Summary (per id) ===")
    print(summary.head())

    print("\n=== Gaps above threshold (per id) ===")
    print(threshold_info.head())
