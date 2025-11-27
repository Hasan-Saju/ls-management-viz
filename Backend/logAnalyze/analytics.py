# analyzer/analytics.py
import os
import pandas as pd
import numpy as np


def load_and_preprocess(file_obj):
    """
    Read CSV and compute delta_min per id, apply initial cleaning.
    Expected columns: time, count, id
    """
    df = pd.read_csv(file_obj)

    # Parse time column
    df["time"] = pd.to_datetime(df["time"])

    # Sort by id + time
    df = df.sort_values(["id", "time"])

    # Compute time differences in minutes
    df["delta_min"] = (
        df.groupby("id")["time"].diff().dt.total_seconds() / 60.0
    )

    # Subtract 10 minutes (your logic)
    df["delta_min"] = df["delta_min"] - 10

    # Remove zeros
    df = df[df["delta_min"] != 0]

    # Drop rows where delta_min is NaN (first event per id)
    df_clean = df.dropna(subset=["delta_min"]).copy()

    return df_clean


def remove_high_outliers_iqr(df_clean):
    """
    Remove high outliers (above Q3 + 1.5*IQR) per id
    """

    def iqr_filter(sub_df):
        Q1 = sub_df["delta_min"].quantile(0.25)
        Q3 = sub_df["delta_min"].quantile(0.75)
        IQR = Q3 - Q1
        upper = Q3 + 1.5 * IQR
        return sub_df[sub_df["delta_min"] <= upper]

    return (
        df_clean.groupby("id", group_keys=False)
        .apply(iqr_filter)
        .reset_index(drop=True)
    )


def gap_stats(group):
    """
    group: all rows for one specific id; columns include:
           time, count, id, delta_min
    """
    x = group["delta_min"]

    stats = {}
    percentiles = [75, 90, 95, 99, 99.5]

    # base stats
    stats["count"] = len(x)
    stats["min_gap"] = float(x.min()) if len(x) else None
    stats["max_gap"] = float(x.max()) if len(x) else None
    stats["mean_gap"] = float(x.mean()) if len(x) else None
    stats["median_gap"] = float(x.median()) if len(x) else None
    stats["std_gap"] = float(x.std()) if len(x) else None

    # percentile stats and count above
    for p in percentiles:
        val = float(np.percentile(x, p)) if len(x) else None
        stats[f"p{p}"] = val
        if val is not None:
            stats[f"count_above_p{p}"] = int((x > val).sum())
            # stats[f"above_p{p}"] = int((x > val).sum())
        else:
            stats[f"count_above_p{p}"] = 0
            # stats[f"above_p{p}"] = 0

    # extreme gaps (> 99.5th percentile)
    p995 = stats["p99.5"]
    if p995 is not None:
        extreme_rows = group[group["delta_min"] > p995]
        stats["times"] = list(extreme_rows["time"].astype(str))
    else:
        stats["times"] = []

    return pd.Series(stats)


def build_summary(df_clean_removed):
    """
    Compute per-id summary stats and return as plain Python objects.
    """
    summary_df = (
        df_clean_removed.groupby("id")
        .apply(gap_stats)
        .reset_index()
    )

    return summary_df.to_dict(orient="records")


def threshold_counts(df_clean_removed, minutes_threshold):
    """
    For a given threshold (minutes), count how many events have delta_min
    greater than that threshold, per id.
    """
    filtered = df_clean_removed[df_clean_removed["delta_min"] > minutes_threshold]
    result = (
        filtered.groupby("id")
        .size()
        .reset_index(name="count_above_threshold")
    )
    return result.to_dict(orient="records")



def read_id_threshold_file(folder_path="data", file_name="id_thresholds.txt"):
    """
    Read data/id_thresholds.txt and return a list of dicts:
    [
      {"id": "A12", "threshold": 30},
      {"id": "B55", "threshold": 120},
      ...
    ]
    """
    output_path = os.path.join(folder_path, file_name)
    data = []

    with open(output_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            id_str, th_str = line.split(",")
            data.append({"id": id_str, "threshold": int(th_str)})

    return data



def get_id_series(df_clean_removed, id_value):
    """
    Get detailed time series for one id (for plotting).
    """
    sub = df_clean_removed[df_clean_removed["id"] == id_value].copy()
    print(df_clean_removed)
    sub = sub.sort_values("time")

    return {
        "id": id_value,
        "time": sub["time"].astype(str).tolist(),
        "delta_min": sub["delta_min"].astype(float).tolist(),
    }
