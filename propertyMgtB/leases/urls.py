from django.urls import path
from .views import LeaseListCreateAPIView, LeaseDetailAPIView

urlpatterns = [
    path('leases', LeaseListCreateAPIView.as_view()),
    path('leases/<int:pk>', LeaseDetailAPIView.as_view()),
]