from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_alter_user_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="force_password_change",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="name",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
