from django.urls import path
from .views import PaymentListAPIView, PaymentMarkPaidAPIView

urlpatterns = [
    path('payments', PaymentListAPIView.as_view()),
    path('payments/<int:pk>/pay', PaymentMarkPaidAPIView.as_view()),
]