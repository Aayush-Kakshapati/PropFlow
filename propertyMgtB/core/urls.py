from django.urls import path

from core.views import DashboardAPIView

urlpatterns = [
    path('dashboard', DashboardAPIView.as_view()),
]