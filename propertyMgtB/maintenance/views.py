from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.utils import timezone

from notifications.services.email_services import send_maintenance_notification

from maintenance.serializers import MaintenanceRequestSerializer

from .models import MaintenanceRequest
from leases.models import Lease

class SimplePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class MaintenanceListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self, user):
        base = MaintenanceRequest.objects.select_related("tenant", "unit", "unit__property").order_by("-created_at")
        if user.role == "tenant":
            return base.filter(tenant=user)
        if user.role == "admin":
            return base
        return base.filter(unit__property__owner=user)

    def get(self, request):
        queryset = self.get_queryset(request.user)
        paginator = SimplePagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = MaintenanceRequestSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if request.user.role != "tenant":
            return Response({"detail": "Only tenants can create requests"}, status=status.HTTP_403_FORBIDDEN)
        active_lease = Lease.objects.filter(
            tenants=request.user,
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date(),
        ).select_related("unit").first()
        if not active_lease:
            return Response({"detail": "No active lease found for tenant."}, status=status.HTTP_400_BAD_REQUEST)
        payload = request.data.copy()
        payload["unit"] = active_lease.unit_id
        serializer = MaintenanceRequestSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        maintenance = serializer.save(tenant=request.user, unit=active_lease.unit, status="pending")
        owner_email = maintenance.unit.property.owner.email
        if owner_email:
            send_maintenance_notification(
                owner_email=owner_email,
                tenant_name=maintenance.tenant.username,
                issue_type=maintenance.title
            )
        return Response(MaintenanceRequestSerializer(maintenance).data, status=status.HTTP_201_CREATED)


class MaintenanceDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        maintenance = MaintenanceRequest.objects.select_related("unit", "unit__property", "tenant").filter(pk=pk).first()
        if not maintenance:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        if new_status not in ["pending", "in_progress", "completed", "cancelled"]:
            return Response({"status": ["Invalid status"]}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        is_owner_admin = user.role in ["owner", "admin"]
        is_tenant = user.role == "tenant" and maintenance.tenant_id == user.id
        if is_owner_admin:
            if user.role == "owner" and maintenance.unit.property.owner_id != user.id:
                return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        elif is_tenant:
            if new_status not in ["completed", "cancelled"]:
                return Response({"detail": "Tenants can only mark completed or cancelled"}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        maintenance.status = new_status
        maintenance.save(update_fields=["status", "updated_at"])
        return Response(MaintenanceRequestSerializer(maintenance).data)

