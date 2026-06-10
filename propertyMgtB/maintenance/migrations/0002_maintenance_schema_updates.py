from django.db import migrations, models


def set_title_from_issue_type(apps, schema_editor):
    MaintenanceRequest = apps.get_model("maintenance", "MaintenanceRequest")
    for request in MaintenanceRequest.objects.all():
        request.title = request.issue_type.replace("_", " ").title()
        request.save(update_fields=["title"])


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0002_property_unit_schema_updates"),
        ("maintenance", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="maintenancerequest",
            name="title",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="maintenancerequest",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="maintenancerequest",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(set_title_from_issue_type, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="maintenancerequest",
            name="issue_type",
        ),
        migrations.AddIndex(
            model_name="maintenancerequest",
            index=models.Index(fields=["tenant", "status"], name="maintenanc_tenant__27fd5d_idx"),
        ),
        migrations.AddIndex(
            model_name="maintenancerequest",
            index=models.Index(fields=["unit", "status"], name="maintenanc_unit_id_fb3d1d_idx"),
        ),
    ]
