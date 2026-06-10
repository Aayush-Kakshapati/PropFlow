from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0002_property_unit_schema_updates"),
    ]

    operations = [
        migrations.AddField(
            model_name="unit",
            name="unit_type",
            field=models.CharField(
                choices=[("individual", "Individual"), ("shared", "Shared")],
                default="individual",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="unit",
            name="capacity",
            field=models.PositiveIntegerField(default=1),
        ),
    ]
