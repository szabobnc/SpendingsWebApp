# Generated manually to fix duplicate column 'date_joined' issue
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_person_options_alter_person_managers_and_more'),
    ]

    operations = [
        # Check if date_joined column exists and remove it if it does
        migrations.RunSQL(
            "ALTER TABLE api_person DROP COLUMN IF EXISTS date_joined;",
            reverse_sql="-- No reverse operation needed"
        ),
    ]