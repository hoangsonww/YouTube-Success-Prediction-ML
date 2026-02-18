from youtube_success_ml.api.routers.analytics import router as analytics_router
from youtube_success_ml.api.routers.health import router as health_router
from youtube_success_ml.api.routers.mlops import router as mlops_router
from youtube_success_ml.api.routers.predictions import router as predictions_router

__all__ = [
    "analytics_router",
    "health_router",
    "mlops_router",
    "predictions_router",
]
