import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .analytics import (
    load_and_preprocess,
    read_id_threshold_file,
    remove_high_outliers_iqr,
    build_summary,
    threshold_counts,
    get_id_series,
)


DF_CLEAN_REMOVED_CACHE = None
SUMMARY_CACHE = None


@csrf_exempt
def upload_csv(request):
    """
    POST /api/upload/
    Body: multipart/form-data with 'file' = CSV
    Returns: summary stats and metric names for visualization
    """
    global DF_CLEAN_REMOVED_CACHE, SUMMARY_CACHE

    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    file_obj = request.FILES.get("file")
    if not file_obj:
        return JsonResponse({"error": "No file uploaded"}, status=400)

    try:
        df_clean = load_and_preprocess(file_obj)
        df_clean_removed = remove_high_outliers_iqr(df_clean)
        summary = build_summary(df_clean_removed)

        DF_CLEAN_REMOVED_CACHE = df_clean_removed
        SUMMARY_CACHE = summary

        metric_keys = []
        if summary:
            sample = summary[0]
            metric_keys = [
                k for k in sample.keys()
                if k not in ("id", "times")
            ]

        return JsonResponse(
            {
                "summary": summary,
                "metrics": metric_keys,
            },
            safe=False,
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def summary_view(request):
    """
    GET /api/summary/
    Returns the last computed summary.
    """
    if SUMMARY_CACHE is None:
        return JsonResponse({"error": "No data processed yet"}, status=400)
    return JsonResponse({"summary": SUMMARY_CACHE}, safe=False)


def detail_view(request, id_value):
    """
    GET /api/detail/<id_value>/
    Returns detailed time series for one id.
    """
    if DF_CLEAN_REMOVED_CACHE is None:
        return JsonResponse({"error": "No data processed yet"}, status=400)

    try:
        id_int = int(id_value)
    except ValueError:
        id_int = id_value

    series = get_id_series(DF_CLEAN_REMOVED_CACHE, id_int)
    return JsonResponse(series, safe=False)


def threshold_view(request):
    """
    GET /api/threshold/?minutes=60
    Returns per-id counts of events with delta_min > minutes.
    """
    if DF_CLEAN_REMOVED_CACHE is None:
        return JsonResponse({"error": "No data processed yet"}, status=400)

    minutes_param = request.GET.get("minutes")
    if minutes_param is None:
        return JsonResponse({"error": "minutes query param required"}, status=400)

    try:
        threshold = float(minutes_param)
    except ValueError:
        return JsonResponse({"error": "minutes must be a number"}, status=400)

    result = threshold_counts(DF_CLEAN_REMOVED_CACHE, threshold)
    return JsonResponse({"threshold": threshold, "results": result}, safe=False)


def get_id_thresholds(request):
    """
    Django view to return the parsed id-threshold data as JSON.
    This will be consumed by the frontend for visualization.
    """
    try:
        data = read_id_threshold_file(folder_path="data", file_name="id_thresholds.txt")
        return JsonResponse(data, safe=False, status=200)

    except FileNotFoundError:
        return JsonResponse({"error": "id_thresholds.txt not found"}, status=404)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)