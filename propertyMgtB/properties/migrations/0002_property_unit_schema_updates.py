from django.db import migrations, models


def set_unit_status(apps, schema_editor):
    Unit = apps.get_model("properties", "Unit")
    Unit.objects.filter(is_occupied=True).update(status="occupied")


class Migration(migrations.Migration):
    dependencies = [
        ("properties", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="property",
            old_name="address",
            new_name="location",
        ),
        migrations.AddField(
            model_name="property",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="unit",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="unit",
            name="status",
            field=models.CharField(choices=[("vacant", "Vacant"), ("occupied", "Occupied")], default="vacant", max_length=20),
        ),
        migrations.AddField(
            model_name="unit",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.RunPython(set_unit_status, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="unit",
            name="is_occupied",
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(fields=["owner"], name="properties_p_owner_i_2ce5d9_idx"),
        ),
        migrations.AddIndex(
            model_name="property",
            index=models.Index(fields=["created_at"], name="properties_p_created_55f248_idx"),
        ),
        migrations.AddIndex(
            model_name="unit",
            index=models.Index(fields=["property", "status"], name="properties_u_propert_24f3fc_idx"),
        ),
    ]
