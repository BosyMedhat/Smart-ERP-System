from django.contrib import admin
# أضيفي Employee هنا في جملة الاستيراد
from .models import (
    Product, StockMovement, WorkShift, 
    Invoice, Installment, Supplier, Purchase, Expense, Treasury,
<<<<<<< HEAD
    Employee,  # تم إضافة الموظفين هنا ✅
    UserProfile
=======
    Employee,  # تم إضافة الموظفين هنا 
    UserProfile,  # RBAC
    StoreSettings  # إعدادات المتجر
>>>>>>> aab4ff3556ce39128544e4a5d5d813a3dc80987e
)

admin.site.register(Product)
admin.site.register(WorkShift)
admin.site.register(Invoice)
admin.site.register(Installment)
admin.site.register(Supplier)
admin.site.register(Purchase)
admin.site.register(Expense)
admin.site.register(Treasury)
admin.site.register(StockMovement)
<<<<<<< HEAD
admin.site.register(Employee) # تم إضافة سطر التسجيل هنا ✅
admin.site.register(UserProfile)
=======
admin.site.register(Employee) # تم إضافة سطر التسجيل هنا 
admin.site.register(UserProfile)  # RBAC
admin.site.register(StoreSettings)  # إعدادات المتجر
>>>>>>> aab4ff3556ce39128544e4a5d5d813a3dc80987e
