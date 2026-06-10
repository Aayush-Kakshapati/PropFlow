from django.contrib.auth import authenticate
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from users.permissions import IsAdminOrOwner
from users.serializers import ChangePasswordSerializer, TenantCreateSerializer, TenantUpdateSerializer, UserSerializer


class LoginAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        })


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class TenantCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get(self, request):
        tenants = User.objects.filter(role="tenant").order_by("username")
        return Response(UserSerializer(tenants, many=True).data)

    def post(self, request):
        serializer = TenantCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = serializer.save()
        return Response(UserSerializer(tenant).data, status=status.HTTP_201_CREATED)


class TenantDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_object(self, pk):
        return User.objects.filter(pk=pk, role="tenant").first()

    def patch(self, request, pk):
        tenant = self.get_object(pk)
        if not tenant:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = TenantUpdateSerializer(tenant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(tenant).data)

    def delete(self, request, pk):
        tenant = self.get_object(pk)
        if not tenant:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            with transaction.atomic():
                tenant.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IntegrityError as e:
            return Response(
                {"detail": "Cannot delete tenant with active leases, payments, or maintenance requests. Please remove related records first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"Failed to delete tenant: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": ["Invalid password"]}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.force_password_change = False
        request.user.save(update_fields=["password", "force_password_change"])
        return Response({"detail": "Password updated"})