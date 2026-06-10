from datetime import date

from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.models import Payment
from users.permissions import IsAdminOrOwner
from .models import Lease, LeaseTenant
from .serializers import LeaseSerializer


class SimplePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class LeaseListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self, user):
        if user.role == "admin":
            return Lease.objects.select_related("unit", "unit__property").prefetch_related("tenants").order_by("-created_at")
        return Lease.objects.select_related("unit", "unit__property").prefetch_related("tenants").filter(unit__property__owner=user).order_by("-created_at")

    def get(self, request):
        queryset = self.get_queryset(request.user)
        paginator = SimplePagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LeaseSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = LeaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = serializer.validated_data["unit"]
        if request.user.role != "admin" and unit.property.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        tenant_ids = serializer.validated_data.pop("tenant_ids", [])
        if len(tenant_ids) > 4:
            return Response({"tenant_ids": ["Maximum 4 tenants allowed per unit."]}, status=status.HTTP_400_BAD_REQUEST)



        lease = serializer.save()
        start_date = lease.start_date
        end_date = lease.end_date
        if end_date < start_date:
            return Response("End Date Cannot be less than Start Date", status= status.HTTP_400_BAD_REQUEST)
        if tenant_ids:
            lease.tenants.set(tenant_ids)
        if lease.tenants.exists():
            unit.status = "occupied"
            unit.save(update_fields=["status"])
        self._generate_monthly_payments(lease)
        return Response(LeaseSerializer(lease).data, status=status.HTTP_201_CREATED)

    def _generate_monthly_payments(self, lease):
        month = date(lease.start_date.year, lease.start_date.month, 1)
        end = date(lease.end_date.year, lease.end_date.month, 1)
        while month <= end:
            due_date = month.replace(day=min(5, 28))
            Payment.objects.get_or_create(
                lease=lease,
                due_date=due_date,
                defaults={
                    "amount_due": lease.rent_amount,
                    "amount_paid": 0,
                    "status": "pending",
                    "late_fee_applied": 0,
                },
            )
            next_month = month.month + 1
            next_year = month.year
            if next_month > 12:
                next_month = 1
                next_year += 1
            month = date(next_year, next_month, 1)


class LeaseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_object(self, request, pk):
        queryset = Lease.objects.all() if request.user.role == "admin" else Lease.objects.filter(unit__property__owner=request.user)
        return queryset.filter(pk=pk).first()

    def get(self, request, pk):
        lease = self.get_object(request, pk)
        if not lease:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(LeaseSerializer(lease).data)

    def patch(self, request, pk):
        lease = self.get_object(request, pk)
        if not lease:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = LeaseSerializer(lease, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        tenant_ids = serializer.validated_data.pop("tenant_ids", None)
        lease = serializer.save()
        if tenant_ids is not None:
            lease.tenants.set(tenant_ids)
        lease.unit.status = "occupied" if lease.tenants.exists() else "vacant"
        lease.unit.save(update_fields=["status"])
        return Response(LeaseSerializer(lease).data)

    def delete(self, request, pk):
        lease = self.get_object(request, pk)
        if not lease:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        unit = lease.unit
        lease.delete()
        if not LeaseTenant.objects.filter(lease__unit=unit).exists():
            unit.status = "vacant"
            unit.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)