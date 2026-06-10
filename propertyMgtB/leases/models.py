from django.db import models
from django.conf import settings
from properties.models import Unit


class Lease(models.Model):
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='leases'
    )

    start_date = models.DateField()
    end_date = models.DateField()
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tenants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='LeaseTenant',
        related_name='lease_memberships'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lease #{self.id} - {self.unit}"

    class Meta:
        indexes = [
            models.Index(fields=['unit', 'start_date']),
            models.Index(fields=['start_date', 'end_date']),
        ]


class LeaseTenant(models.Model):
    lease = models.ForeignKey(Lease, on_delete=models.CASCADE, related_name='lease_tenants')
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenant_leases')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant.username} - Lease #{self.lease_id}"

    class Meta:
        unique_together = ('lease', 'tenant')
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['lease']),
        ]

