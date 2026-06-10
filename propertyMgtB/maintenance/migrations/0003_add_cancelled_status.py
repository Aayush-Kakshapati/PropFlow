from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("maintenance", "0002_maintenance_schema_updates"),
    ]

    operations = [
        migrations.AlterField(
            model_name="maintenancerequest",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("in_progress", "In Progress"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
