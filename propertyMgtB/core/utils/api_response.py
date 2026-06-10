from rest_framework.response import Response


def success_response(data=None, message=""):
    return Response({
        "success": True,
        "data": data,
        "message": message
    })


def error_response(message, status_code=400):
    return Response({
        "success": False,
        "error": message
    }, status=status_code)