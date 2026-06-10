from django.utils import timezone


def calculate_priority(maintenance_request):

    priority_score = 0
    
    days_old = (timezone.now().date() - maintenance_request.created_at.date()).days
    if days_old > 7:
        priority_score += 3
    elif days_old > 3:
        priority_score += 2
    else:
        priority_score += 1
    
    if maintenance_request.status == 'pending':
        priority_score += 2
    elif maintenance_request.status == 'in_progress':
        priority_score += 1
    
    if priority_score >= 4:
        return "High"
    elif priority_score >= 3:
        return "Medium"
    else:
        return "Low"
