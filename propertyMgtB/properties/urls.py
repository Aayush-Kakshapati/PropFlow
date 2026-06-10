from django.urls import path
from properties.views import (
    PropertyListCreateAPIView,
    PropertyDetailAPIView,
    UnitListCreateAPIView,
    UnitDetailAPIView,
)

urlpatterns = [
    path('properties', PropertyListCreateAPIView.as_view()),
    path('properties/<int:pk>', PropertyDetailAPIView.as_view()),
    path('units', UnitListCreateAPIView.as_view()),
    path('units/<int:pk>', UnitDetailAPIView.as_view()),
]