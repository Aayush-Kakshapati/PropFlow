from rest_framework import serializers
from .models import Lease
from users.models import User


class LeaseSerializer(serializers.ModelSerializer):
    tenant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    tenants = serializers.SerializerMethodField(read_only=True)
    tenant = serializers.SerializerMethodField(read_only=True)
    unit_name = serializers.SerializerMethodField(read_only=True)
    property = serializers.SerializerMethodField(read_only=True)
    is_active = serializers.SerializerMethodField(read_only=True)

    class Meta:from rest_framework import serializers
from .models import Lease
from users.models import User


class LeaseSerializer(serializers.ModelSerializer):
    tenant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    tenants = serializers.SerializerMethodField(read_only=True)
    tenant = serializers.SerializerMethodField(read_only=True)
    unit_name = serializers.SerializerMethodField(read_only=True)
    property = serializers.SerializerMethodField(read_only=True)
    is_active = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Lease
        fields = ['id', 'unit', 'unit_name', 'property', 'start_date', 'end_date', 'rent_amount', 'late_fee', 'tenant_ids', 'tenants', 'tenant', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tenants(self, obj):
        return [{'id': tenant.id, 'username': tenant.username} for tenant in obj.tenants.all()]

    def get_tenant(self, obj):
        first_tenant = obj.tenants.first()
        return first_tenant.username if first_tenant else None

    def get_unit_name(self, obj):
        return obj.unit.name

    def get_property(self, obj):
        return obj.unit.property.name

    def get_is_active(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date

    def validate_tenant_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate tenant IDs are not allowed.")
        if len(value) > 4:
            raise serializers.ValidationError("A unit can have at most 4 tenants.")
        tenants = User.objects.filter(id__in=value, role='tenant')
        if tenants.count() != len(value):
            raise serializers.ValidationError("Invalid tenant IDs provided.")
        return value

    def validate(self, data):
        tenant_ids = data.get('tenant_ids') or []
        unit = data.get('unit') or getattr(self.instance, 'unit', None)
        start_date = data.get('start_date') or getattr(self.instance, 'start_date', None)
        end_date = data.get('end_date') or getattr(self.instance, 'end_date', None)
        if tenant_ids and unit and start_date and end_date:
            conflicting = Lease.objects.filter(
                tenants__id__in=tenant_ids,
                start_date__lte=end_date,
                end_date__gte=start_date
            ).exclude(unit=unit).distinct()
            if self.instance:
                conflicting = conflicting.exclude(id=self.instance.id)
            if conflicting.exists():
                raise serializers.ValidationError("One or more tenants already have an overlapping lease on another unit.")
            if start_date > end_date:
                raise serializers.ValidationError("Start date cannot be greater than End date.")
        return data

        model = Lease
        fields = ['id', 'unit', 'unit_name', 'property', 'start_date', 'end_date', 'rent_amount', 'late_fee', 'tenant_ids', 'tenants', 'tenant', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tenants(self, obj):
        return [{'id': tenant.id, 'username': tenant.username} for tenant in obj.tenants.all()]

    def get_tenant(self, obj):
        first_tenant = obj.tenants.first()
        return first_tenant.username if first_tenant else None

    def get_unit_name(self, obj):
        return obj.unit.name

    def get_property(self, obj):
        return obj.unit.property.name

    def get_is_active(self, obj):
        from django.utils import timezone
        today = timezone.now().date()
        return obj.start_date <= today <= obj.end_date

    def validate_tenant_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate tenant IDs are not allowed.")
        if len(value) > 4:
            raise serializers.ValidationError("A unit can have at most 4 tenants.")
        tenants = User.objects.filter(id__in=value, role='tenant')
        if tenants.count() != len(value):
            raise serializers.ValidationError("Invalid tenant IDs provided.")
        return value

    def validate(self, data):
        tenant_ids = data.get('tenant_ids') or []
        unit = data.get('unit') or getattr(self.instance, 'unit', None)
        start_date = data.get('start_date') or getattr(self.instance, 'start_date', None)
        end_date = data.get('end_date') or getattr(self.instance, 'end_date', None)
        if tenant_ids and unit and start_date and end_date:
            conflicting = Lease.objects.filter(
                tenants__id__in=tenant_ids,
                start_date__lte=end_date,
                end_date__gte=start_date
            ).exclude(unit=unit).distinct()
            if self.instance:
                conflicting = conflicting.exclude(id=self.instance.id)
            if conflicting.exists():
                raise serializers.ValidationError("One or more tenants already have an overlapping lease on another unit.")
            if start_date > end_date:
                raise serializers.ValidationError("Start date cannot be greater than End date.")
        return data
