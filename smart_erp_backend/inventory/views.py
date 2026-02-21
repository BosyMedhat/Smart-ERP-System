# el view sets de ele ptgma3 kol el 3amlayat  
# (عرض، إضافة، حذف، تعديل)
#  في كود واحد بدل ما تكتب كل واحدة لوحدها.
from rest_framework import viewsets

from .models import Product
from .serializers import ProductSerializer

# hena ana pawres men el ModelViewSets
# we da ma3nah en el class da p2a 3ando el kodra eno y3mel el 5 3amalayt
# List: عرض كل المنتجات.

# Create: إضافة منتج جديد.

# Retrieve: عرض تفاصيل منتج واحد.

# Update: تعديل منتج.

# Destroy: حذف منتج.
class ProductViewSet(viewsets.ModelViewSet): 
    #  hena pakol lma 7ad ytlp payanat roo7 hat kol el data men poducts taple   
    queryset = Product.objects.all()
    #  hena pakol lma t7tag t7wel el data le json est5dm el serializer da
    serializer_class = ProductSerializer