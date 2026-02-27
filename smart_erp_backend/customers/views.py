from rest_framework import viewsets
from .models import Customer
from .serializers import CustomerSerializer

# مدير العملاء فقط
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer