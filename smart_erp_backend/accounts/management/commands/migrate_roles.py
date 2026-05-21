"""
Management command: migrate_roles
Maps existing UserProfile.role (Arabic string) -> UserProfile.role_new (FK)
Idempotent: skips users who already have role_new set.
"""
from django.core.management.base import BaseCommand
from inventory.models import UserProfile
from accounts.models import Role

ROLE_MAP = {
    'مدير':      'مدير',
    'كاشير':     'كاشير',
    'محاسب':     'محاسب',
    'أمين مخزن': 'أمين مخزن',
}


class Command(BaseCommand):
    help = 'Migrate UserProfile.role (string) -> role_new (FK) — idempotent'

    def handle(self, *args, **options):
        profiles = UserProfile.objects.select_related(
            'user', 'role_new'
        ).all()

        migrated = 0
        skipped  = 0
        errors   = 0

        for profile in profiles:
            # Skip if already migrated
            if profile.role_new_id is not None:
                skipped += 1
                continue

            role_name = profile.role
            if not role_name:
                self.stdout.write(
                    f'  ! User [{profile.user.username}] '
                    f'has no role string — skipping'
                )
                errors += 1
                continue

            mapped_name = ROLE_MAP.get(role_name)
            if not mapped_name:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ! Unknown role [{role_name}] '
                        f'for user [{profile.user.username}] — skipping'
                    )
                )
                errors += 1
                continue

            try:
                role_obj = Role.objects.get(name=mapped_name)
                profile.role_new = role_obj
                profile.save(update_fields=['role_new'])
                self.stdout.write(
                    f'  + [{profile.user.username}] '
                    f'{role_name} -> FK({role_obj.id})'
                )
                migrated += 1
            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f'  X Role [{mapped_name}] not found in DB '
                        f'(run sync_permissions first)'
                    )
                )
                errors += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nmigrate_roles done: '
                f'{migrated} migrated, {skipped} skipped, {errors} errors'
            )
        )
