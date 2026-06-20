from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0028_installment_validators'),
    ]

    operations = [
        migrations.AddField(
            model_name='storesettings',
            name='enable_tax',
            field=models.BooleanField(default=False, verbose_name='تفعيل الضريبة'),
        ),
    ]
