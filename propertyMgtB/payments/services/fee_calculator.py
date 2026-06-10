from decimal import Decimal
from datetime import date


def calculate_late_fee(rent_amount, due_date, payment_date=None):

    if payment_date is None:
        payment_date = date.today()
    
    if payment_date <= due_date:
        return Decimal("0")
    
    days_overdue = (payment_date - due_date).days
    
    if days_overdue <= 5:
        fee_percentage = Decimal("0.05")
    elif days_overdue <= 15:
        fee_percentage = Decimal("0.10")
    else:
        fee_percentage = Decimal("0.15")
    
    late_fee = rent_amount * fee_percentage
    return late_fee.quantize(Decimal("0.01"))
