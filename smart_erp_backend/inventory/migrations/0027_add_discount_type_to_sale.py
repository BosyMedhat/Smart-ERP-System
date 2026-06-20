# Generated migration for Professional Discount System (ERP-P1-003)
# Adds discount_type field to Sale model with legacy support for historical data

from django.db import migrations, models


def set_legacy_discount_type_for_existing_records(apps, schema_editor):
    """
    Set discount_type to 'legacy' for all existing Sale records.
    This ensures historical invoices are NOT automatically interpreted as
    either percentage or fixed - they remain untouched with their original meaning.
    """
    Sale = apps.get_model('inventory', 'Sale')
    # Update all existing records to have discount_type='legacy'
    Sale.objects.all().update(discount_type='legacy')


class Migration(migrations.Migration):
    dependencies = [
        ('inventory', '0026_add_dynamic_pricing_to_storesettings'),
    ]

    operations = [
        # Add the discount_type field with choices: percentage, fixed, legacy
        migrations.AddField(
            model_name='sale',
            name='discount_type',
            field=models.CharField(
                choices=[
                    ('percentage', 'نسبة %'),
                    ('fixed', 'مبلغ ثابت'),
                    ('legacy', 'سجل قديم'),
                ],
                default='percentage',
                max_length=10,
                verbose_name='نوع الخصم',
            ),
        ),
        # Run data migration to mark all existing records as 'legacy'
        migrations.RunPython(
            set_legacy_discount_type_for_existing_records,
            reverse_code=migrations.RunPython.noop  # No reverse operation needed
        ),
    ]
