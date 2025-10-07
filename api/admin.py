from django.contrib import admin
from .models import Person, Token, Category, Transaction

# Register your models here.
admin.site.register(Person)
admin.site.register(Token)
admin.site.register(Category)
admin.site.register(Transaction)