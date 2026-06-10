from django.db import models

from leases.models import Lease


class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('late', 'Late'),
    )

    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE, related_name='payments'
    )
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    late_fee_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment #{self.id} - Lease #{self.lease_id}"

    class Meta:
        indexes = [
            models.Index(fields=['lease', 'status']),
            models.Index(fields=['due_date']),
        ]