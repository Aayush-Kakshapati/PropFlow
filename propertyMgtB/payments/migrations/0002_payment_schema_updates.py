from django.db import migrations, models


def migrate_payment_fields(apps, schema_editor):
    Payment = apps.get_model("payments", "Payment")
    for payment in Payment.objects.all():
        payment.amount_due = payment.amount
        payment.amount_paid = payment.amount
        payment.due_date = payment.payment_date
        payment.paid_date = payment.payment_date
        payment.status = "paid"
        payment.save(update_fields=["amount_due", "amount_paid", "due_date", "paid_date", "status"])


class Migration(migrations.Migration):
    dependencies = [
        ("leases", "0002_lease_schema_updates"),
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="amount_due",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payment",
            name="amount_paid",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payment",
            name="due_date",
            field=models.DateField(null=True),
        ),
        migrations.AddField(
            model_name="payment",
            name="late_fee_applied",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payment",
            name="paid_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="payment",
            name="status",
            field=models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("late", "Late")], default="pending", max_length=20),
        ),
        migrations.AddField(
            model_name="payment",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
            preserve_default=False,
        ),
        migrations.RunPython(migrate_payment_fields, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="payment",
            name="due_date",
            field=models.DateField(),
        ),
        migrations.RemoveField(model_name="payment", name="amount"),
        migrations.RemoveField(model_name="payment", name="payment_date"),
        migrations.RemoveField(model_name="payment", name="reference"),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["lease", "status"], name="payments_pay_lease_i_667321_idx"),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["due_date"], name="payments_pay_due_dat_8a66c8_idx"),
        ),
    ]
