from rest_framework import serializers
from .models import SystemConfiguration

class SystemConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfiguration
        fields = '__all__' # يعني ابعت كل البيانات (الاسم، العنوان، اللوجو) للفرونت