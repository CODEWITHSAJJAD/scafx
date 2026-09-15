from django.urls import path
from core.views import api_root, health_check

urlpatterns = [
    path("health", health_check, name="health"),
    path("api/health", health_check, name="api-health"),
    path("api", api_root, name="api-root"),
    path("api/", api_root, name="api-root-slash"),
    path("", api_root, name="root"),
]
