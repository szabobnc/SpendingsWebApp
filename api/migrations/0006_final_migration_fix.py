# Generated manually to completely fix the migration issues
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_remove_duplicate_date_joined_fix'),
    ]

    operations = [
        # This migration ensures the database schema is clean
        migrations.RunSQL(
            # Check if date_joined exists and drop it
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'api_person' 
                    AND column_name = 'date_joined'
                ) THEN
                    ALTER TABLE api_person DROP COLUMN date_joined;
                END IF;
            END $$;
            """,
            reverse_sql="-- No reverse operation needed"
        ),
    ]