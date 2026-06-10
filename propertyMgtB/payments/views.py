from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdminOrOwner
from .models import Payment
from .serializer import PaymentSerializer
from .services.fee_calculator import calculate_late_fee


class SimplePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PaymentListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self, user):
        base = Payment.objects.select_related("lease", "lease__unit", "lease__unit__property").prefetch_related("lease__tenants")
        if user.role == "tenant":
            return base.filter(lease__tenants=user).order_by("-due_date")
        if user.role == "admin":
            return base.order_by("-due_date")
        return base.filter(lease__unit__property__owner=user).order_by("-due_date")

    def get(self, request):
        queryset = self.get_queryset(request.user)
        tenant_id = request.query_params.get("tenant_id")
        lease_id = request.query_params.get("lease_id")
        if tenant_id:
            queryset = queryset.filter(lease__tenants__id=tenant_id)
        if lease_id:
            queryset = queryset.filter(lease_id=lease_id)
        paginator = SimplePagination()
        page = paginator.paginate_queryset(queryset.distinct(), request)
        serializer = PaymentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class PaymentMarkPaidAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def patch(self, request, pk):
        payment = Payment.objects.select_related("lease", "lease__unit", "lease__unit__property").filter(pk=pk).first()
        if not payment:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role != "admin" and payment.lease.unit.property.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        amount_paid = Decimal(str(request.data.get("amount_paid", payment.amount_due)))
        if amount_paid <= 0:
            return Response({"amount_paid": ["Amount must be greater than zero."]}, status=status.HTTP_400_BAD_REQUEST)
        today = timezone.now().date()
        late_fee = calculate_late_fee(payment.lease.rent_amount, payment.due_date, today)
        payment.amount_paid = (payment.amount_paid or Decimal("0")) + amount_paid
        payment.paid_date = today
        payment.late_fee_applied = late_fee
        payment.status = "paid" if payment.amount_paid >= payment.amount_due else "pending"
        payment.save(update_fields=["amount_paid", "paid_date", "late_fee_applied", "status", "updated_at"])
        return Response(PaymentSerializer(payment).data)