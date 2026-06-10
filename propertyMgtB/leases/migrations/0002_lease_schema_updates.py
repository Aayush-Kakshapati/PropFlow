from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def move_tenant_to_leasetenant(apps, schema_editor):
    Lease = apps.get_model("leases", "Lease")
    LeaseTenant = apps.get_model("leases", "LeaseTenant")
    for lease in Lease.objects.exclude(tenant_id=None):
        LeaseTenant.objects.get_or_create(lease_id=lease.id, tenant_id=lease.tenant_id)


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0002_property_unit_schema_updates"),
        ("leases", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="lease",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="lease",
            name="late_fee",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="lease",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name="LeaseTenant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("lease", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lease_tenants", to="leases.lease")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tenant_leases", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "unique_together": {("lease", "tenant")},
            },
        ),
        migrations.RunPython(move_tenant_to_leasetenant, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="lease",
            name="tenant",
        ),
        migrations.RemoveField(
            model_name="lease",
            name="is_active",
        ),
        migrations.AddField(
            model_name="lease",
            name="tenants",
            field=models.ManyToManyField(related_name="lease_memberships", through="leases.LeaseTenant", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddIndex(
            model_name="lease",
            index=models.Index(fields=["unit", "start_date"], name="leases_lease_unit_id_b7d63f_idx"),
        ),
        migrations.AddIndex(
            model_name="lease",
            index=models.Index(fields=["start_date", "end_date"], name="leases_lease_start_d_edcaf6_idx"),
        ),
        migrations.AddIndex(
            model_name="leasetenant",
            index=models.Index(fields=["tenant"], name="leases_leas_tenant__5f8f38_idx"),
        ),
        migrations.AddIndex(
            model_name="leasetenant",
            index=models.Index(fields=["lease"], name="leases_leas_lease_i_f039a1_idx"),
        ),
    ]
