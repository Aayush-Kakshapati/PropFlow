from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    USER_ROLES = (
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('tenant', 'Tenant'),
    )

    role = models.CharField(max_length=20, choices=USER_ROLES, default='tenant')
    name = models.CharField(max_length=255, blank=True)
    force_password_change = models.BooleanField(default=False)

