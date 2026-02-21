from django.apps import AppConfig # السطر ده هو اللي ناقصك

class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'customers'