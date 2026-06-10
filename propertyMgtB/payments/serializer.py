from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    tenant_ids = serializers.SerializerMethodField()
    tenant = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    payment_date = serializers.SerializerMethodField()
    reference = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'lease',
            'amount_due',
            'amount_paid',
            'due_date',
            'paid_date',
            'status',
            'late_fee_applied',
            'tenant_ids',
            'tenant',
            'property',
            'unit',
            'amount',
            'payment_date',
            'reference',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'paid_date', 'late_fee_applied', 'created_at', 'updated_at', 'tenant_ids']

    def get_tenant_ids(self, obj):
        return list(obj.lease.tenants.values_list('id', flat=True))

    def get_tenant(self, obj):
        first_tenant = obj.lease.tenants.first()
        return first_tenant.username if first_tenant else None

    def get_property(self, obj):
        return obj.lease.unit.property.name

    def get_unit(self, obj):
        return obj.lease.unit.name

    def get_amount(self, obj):
        return obj.amount_paid or obj.amount_due

    def get_payment_date(self, obj):
        return obj.paid_date

    def get_reference(self, obj):
        return None