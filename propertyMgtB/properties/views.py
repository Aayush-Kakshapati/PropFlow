from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAdminOrOwner
from .models import Property, Unit
from .serializers import PropertySerializer, UnitSerializer


class SimplePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PropertyListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self, user):
        if user.role == "admin":
            return Property.objects.all().order_by("-created_at")
        return Property.objects.filter(owner=user).order_by("-created_at")

    def get(self, request):
        paginator = SimplePagination()
        queryset = self.get_queryset(request.user)
        page = paginator.paginate_queryset(queryset, request)
        serializer = PropertySerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PropertySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        property_obj = serializer.save(owner=request.user)
        return Response(PropertySerializer(property_obj).data, status=status.HTTP_201_CREATED)


class PropertyDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_object(self, request, pk):
        queryset = Property.objects.all() if request.user.role == "admin" else Property.objects.filter(owner=request.user)
        return queryset.filter(pk=pk).first()

    def get(self, request, pk):
        property_obj = self.get_object(request, pk)
        if not property_obj:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(PropertySerializer(property_obj).data)

    def patch(self, request, pk):
        property_obj = self.get_object(request, pk)
        if not property_obj:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = PropertySerializer(property_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        property_obj = self.get_object(request, pk)
        if not property_obj:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        property_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnitListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self, user):
        if user.role == "admin":
            return Unit.objects.select_related("property").all().order_by("-created_at")
        return Unit.objects.select_related("property").filter(property__owner=user).order_by("-created_at")

    def get(self, request):
        queryset = self.get_queryset(request.user)
        property_id = request.query_params.get("property_id")
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        paginator = SimplePagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = UnitSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = UnitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit_property = serializer.validated_data["property"]
        if request.user.role != "admin" and unit_property.owner_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        unit = serializer.save()
        return Response(UnitSerializer(unit).data, status=status.HTTP_201_CREATED)


class UnitDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOwner]

    def get_object(self, request, pk):
        queryset = Unit.objects.all() if request.user.role == "admin" else Unit.objects.filter(property__owner=request.user)
        return queryset.filter(pk=pk).first()

    def get(self, request, pk):
        unit = self.get_object(request, pk)
        if not unit:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(UnitSerializer(unit).data)

    def patch(self, request, pk):
        unit = self.get_object(request, pk)
        if not unit:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UnitSerializer(unit, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        unit = self.get_object(request, pk)
        if not unit:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        unit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)