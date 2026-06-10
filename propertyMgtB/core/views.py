from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from properties.models import Property, Unit
from properties.services.occupancy_calculator import calculate_occupancy_rate
from leases.models import Lease
from payments.models import Payment
from maintenance.models import MaintenanceRequest


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == "tenant":
            tenant_lease = Lease.objects.filter(tenants=request.user).select_related("unit", "unit__property").order_by("-start_date").first()
            payments = Payment.objects.filter(lease__tenants=request.user).order_by("-due_date")
            maintenance = MaintenanceRequest.objects.filter(tenant=request.user).order_by("-created_at")
            return Response({
                "role": "tenant",
                "current_lease": {
                    "id": tenant_lease.id,
                    "unit": tenant_lease.unit.name,
                    "property": tenant_lease.unit.property.name,
                    "rent_amount": tenant_lease.rent_amount,
                    "start_date": tenant_lease.start_date,
                    "end_date": tenant_lease.end_date,
                } if tenant_lease else None,
                "rent_status": payments.first().status if payments.exists() else "pending",
                "payment_history_count": payments.count(),
                "maintenance_count": maintenance.count(),
            })

        owner_filter = {} if request.user.role == "admin" else {"owner": request.user}
        owner_properties = Property.objects.filter(**owner_filter)
        units = Unit.objects.filter(property__in=owner_properties)
        leases = Lease.objects.filter(unit__property__in=owner_properties)
        payments = Payment.objects.filter(lease__unit__property__in=owner_properties)
        pending_payments = payments.filter(status__in=["pending", "late"]).count()
        pending_maintenance = MaintenanceRequest.objects.filter(unit__property__in=owner_properties, status__in=["pending", "in_progress"]).count()
        total_revenue = payments.filter(status="paid").aggregate(total=Sum('amount_paid'))['total'] or 0
        
        occupancy_data = calculate_occupancy_rate(owner_properties)

        return Response({
            "role": request.user.role,
            "total_properties": owner_properties.count(),
            "total_units": occupancy_data['total_units'],
            "occupied_units": occupancy_data['occupied_units'],
            "occupancy_rate": occupancy_data['occupancy_rate'],
            "occupancy_status": occupancy_data['status'],
            "active_leases": leases.count(),
            "pending_payments": pending_payments,
            "pending_maintenance": pending_maintenance,
            "total_revenue": total_revenue,
        })