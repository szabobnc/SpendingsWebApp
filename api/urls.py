from django.urls import path
from .views import RegistrationView, LoginView, GetCategoriesView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("getCategories/", GetCategoriesView.as_view(), name="getCategories")
    #path("createTransaction//", CreateTransactionView.as_view(), name="create_transaction") TODO
]
