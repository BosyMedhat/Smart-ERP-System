import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_erp_backend.settings')
django.setup()

from django.contrib.auth.models import User
user = User.objects.get(username='amira')
user.username = 'Esraaa'
user.set_password('Ae123456')
user.is_staff = True
user.is_superuser = True
user.save()
print("User updated successfully!")