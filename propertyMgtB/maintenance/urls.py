from django.urls import path
from maintenance.views import MaintenanceListCreateAPIView, MaintenanceDetailAPIView

urlpatterns = [
    path('maintenance', MaintenanceListCreateAPIView.as_view()),
    path('maintenance/<int:pk>', MaintenanceDetailAPIView.as_view()),
]