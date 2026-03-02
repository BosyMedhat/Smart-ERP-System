from django.apps import AppConfig

class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'

    def ready(self):
        # السطر ده هو اللي بيخلي الباك إند "يصحى" ويربط الجداول ببعض
        import inventory.signals