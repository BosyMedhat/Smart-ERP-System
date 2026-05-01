from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from inventory.models import Employee


class Command(BaseCommand):
    help = 'Create Employee records from existing auth.User objects'

    def handle(self, *args, **options):
        # Get all users that don't have an employee record yet
        users_without_employee = User.objects.filter(employee_profile__isnull=True)
        
        created_count = 0
        
        for user in users_without_employee:
            # Get full name or use username
            name = user.get_full_name() or user.username
            
            # Create employee record
            Employee.objects.create(
                user=user,
                name=name,
                position='موظف',
                baseSalary=3000,
                advances=0,
                incentives=0,
                attendance='present'
            )
            created_count += 1
            self.stdout.write(f'  Created: {name}')
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Successfully created {created_count} Employee records')
        )
