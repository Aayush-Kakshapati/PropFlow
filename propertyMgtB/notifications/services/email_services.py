from django.core.mail import send_mail


def send_maintenance_notification(owner_email, tenant_name, issue_type):
    send_mail(
        subject="New Maintenance Request",
        message=f"{tenant_name} reported a {issue_type} issue.",
        from_email="no-reply@propertysaas.com",
        recipient_list=[owner_email],
        fail_silently=False,
    )
