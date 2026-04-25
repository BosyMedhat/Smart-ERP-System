from django.urls import path
from . import views
from .views import SmartAnalyticsView

urlpatterns = [
    path('ask/', views.ask_ai, name='ask_ai'),
    path('analytics/', SmartAnalyticsView.as_view(), name='ai_analytics'),
]