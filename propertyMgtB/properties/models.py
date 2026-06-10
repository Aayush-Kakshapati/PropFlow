from django.db import models

# Create your models here.
from django.db import models
from django.conf import settings
from django.utils import timezone


class Property(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='properties'
    )
    name = models.CharField(max_length=255)
    location = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['created_at']),
        ]


class Unit(models.Model):

    UNIT_TYPE_CHOICES = [
        ('individual', 'Individual'),
        ('shared', 'Shared'),
    ]

    STATUS_CHOICES = (
        ('vacant', 'Vacant'),
        ('occupied', 'Occupied'),
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='units'
    )
    name = models.CharField(max_length=100)
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='vacant')
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES)
    capacity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.property.name} - {self.name}"

    def current_occupancy(self):
        from leases.models import LeaseTenant
        today = timezone.now().date()

        return LeaseTenant.objects.filter(
            lease__unit=self,
            lease__start_date__lte=today,
            lease__end_date__gte=today
        ).count()

    def is_full(self):
        return self.current_occupancy() >= self.capacity

    class Meta:
        indexes = [
            models.Index(fields=['property', 'status']),
        ]