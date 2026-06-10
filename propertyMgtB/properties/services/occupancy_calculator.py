from properties.models import Unit


def calculate_occupancy_rate(properties=None):
    if properties is None:
        units = Unit.objects.all()
    else:
        units = Unit.objects.filter(property__in=properties)
    
    total_units = units.count()
    occupied_units = units.filter(status='occupied').count()
    
    if total_units == 0:
        occupancy_rate = 0.0
    else:
        occupancy_rate = (occupied_units / total_units) * 100
    
    if occupancy_rate >= 80:
        status = "High"
    elif occupancy_rate >= 50:
        status = "Medium"
    else:
        status = "Low"
    
    return {
        'total_units': total_units,
        'occupied_units': occupied_units,
        'occupancy_rate': round(occupancy_rate, 2),
        'status': status
    }
