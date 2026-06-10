from django.urls import path
from users.views import LoginAPIView, MeAPIView, TenantCreateAPIView, TenantDetailAPIView, ChangePasswordAPIView

urlpatterns = [
    path('auth/login', LoginAPIView.as_view()),
    path('auth/me', MeAPIView.as_view()),
    path('auth/change-password', ChangePasswordAPIView.as_view()),
    path('tenants', TenantCreateAPIView.as_view()),
    path('tenants/<int:pk>', TenantDetailAPIView.as_view()),
]