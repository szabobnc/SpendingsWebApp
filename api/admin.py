from django.contrib import admin
from .models import Person, Token

# Register your models here.
admin.site.register(Person)
admin.site.register(Token)