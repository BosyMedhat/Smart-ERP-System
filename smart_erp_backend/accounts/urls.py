from django.urls import path

from accounts.views import me_view

urlpatterns = [
    path('me/', me_view, name='accounts-me'),
]
