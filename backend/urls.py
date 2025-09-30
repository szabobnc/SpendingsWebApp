from django.contrib import admin
from django.urls import path
from api.views import hello_world

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/hello/', hello_world),
]
