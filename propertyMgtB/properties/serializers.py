from rest_framework import serializers
from .models import Property
from .models import Unit


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'name', 'location', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


from rest_framework import serializers
from .models import Unit


class UnitSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    current_occupancy = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id',
            'property',
            'name',
            'rent_amount',
            'unit_type',
            'capacity',
            'created_at',
            'updated_at',
            'status',
            'current_occupancy',
            'is_full',
        ]

    def get_current_occupancy(self, obj):
        return obj.current_occupancy()

    def get_is_full(self, obj):
        return obj.current_occupancy() >= obj.capacity

    def get_status(self, obj):
        return "occupied" if obj.current_occupancy() > 0 else "vacant"