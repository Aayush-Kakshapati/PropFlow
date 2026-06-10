from django.db import models
from django.conf import settings
from django.utils import timezone
from properties.models import Unit
from leases.models import Lease

# Create your models here.
class MaintenanceRequest(models.Model):

    STATUS_CHOICES= (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )

    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name='maintenance_requests'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.tenant and not self.unit:
            active_lease = Lease.objects.filter(
                tenants=self.tenant,
                end_date__gte=timezone.now().date()
            ).first()
            
            if active_lease:
                self.unit = active_lease.unit
        
        super().save(*args, **kwargs)

    def calculate_priority(self):
        from .services.priority_calculator import calculate_priority as calc_priority
        return calc_priority(self)

    def __str__(self):
        return f"{self.tenant.username} - {self.title}"

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['unit', 'status']),
        ]