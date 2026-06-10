from rest_framework import serializers
from .models import MaintenanceRequest
from .services.priority_calculator import calculate_priority


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    tenant = serializers.SerializerMethodField(read_only=True)
    unit_name = serializers.SerializerMethodField(read_only=True)
    issue_type = serializers.SerializerMethodField(read_only=True)
    priority = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = ['id', 'unit', 'unit_name', 'tenant', 'title', 'issue_type', 'description', 'status', 'created_at', 'updated_at', 'priority']
        read_only_fields = ['id', 'tenant', 'status', 'created_at', 'updated_at', 'priority']

    def get_tenant(self, obj):
        return {'id': obj.tenant.id, 'username': obj.tenant.username}

    def get_unit_name(self, obj):
        return obj.unit.name

    def get_issue_type(self, obj):
        return obj.title

    def get_priority(self, obj):
        return calculate_priority(obj)