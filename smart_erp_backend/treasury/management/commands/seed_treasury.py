from django.core.management.base import BaseCommand
from treasury.models import TreasuryAccount


class Command(BaseCommand):
    help = 'إنشاء حسابات الخزينة الافتراضية'

    def handle(self, *args, **kwargs):
        accounts = [
            {'name': 'CASH',     'display_name': 'الخزينة النقدية'},
            {'name': 'BANK',     'display_name': 'الحساب البنكي'},
            {'name': 'VODAFONE', 'display_name': 'فودافون كاش'},
            {'name': 'INSTAPAY', 'display_name': 'إنستاباي'},
            {'name': 'CARD',     'display_name': 'بطاقة بنكية'},
        ]
        for acc in accounts:
            obj, created = TreasuryAccount.objects.get_or_create(
                name=acc['name'],
                defaults={'display_name': acc['display_name']}
            )
            status = 'تم الإنشاء ✅' if created else 'موجود مسبقاً ⏭️'
            self.stdout.write(f"{acc['display_name']} — {status}")

        self.stdout.write(self.style.SUCCESS('اكتمل seed الخزينة'))
