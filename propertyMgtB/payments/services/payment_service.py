from django.db.models import Sum

def get_total_paid(lease):
    total  = lease.payments.aggregate(total=Sum('amount'))['total']
    return total or 0

def get_remaining_balance(lease):
    total_paid = get_total_paid(lease)
    return lease.rent_amount - total_paid