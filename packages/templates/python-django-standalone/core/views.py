from datetime import datetime, timezone
from django.http import JsonResponse


def health_check(_request):
    return JsonResponse({
        "status": "ok",
        "service": "{{projectName}}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def api_root(_request):
    return JsonResponse({
        "message": "Welcome to {{projectName}} API",
        "stack": "{{stack}}",
        "framework": "{{framework}}",
    })
