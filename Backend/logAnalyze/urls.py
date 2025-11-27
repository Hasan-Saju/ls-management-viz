# analyzer/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("upload/", views.upload_csv, name="upload_csv"),
    path("summary/", views.summary_view, name="summary"),
    path("detail/<id_value>/", views.detail_view, name="detail"),
    path("threshold/", views.threshold_view, name="threshold"),
    path("id-thresholds/", views.get_id_thresholds, name="get_id_thresholds"),
]
