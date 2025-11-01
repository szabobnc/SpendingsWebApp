from django.urls import path
from .views import RegistrationView, LoginView, GetCategoriesView, TransactionCreateView ,account_view
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import transaction_list
# urls.py (existing imports)
from django.urls import path
#from .views import RegistrationView, LoginView, GetCategoriesView, TransactionCreateView, account_view # <-- Add account_view here
# ...

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("getCategories/", GetCategoriesView.as_view(), name="getCategories"),
    path("createTransaction/", TransactionCreateView.as_view(), name="create_transaction"),
    path('transactions/', transaction_list, name='transaction-list'),
    path('createCategory/', views.createCategory, name='createCategory'),
    path('transactions/', views.transaction_list, name='transaction-list'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction-detail'),
    #path('account/', account_view, name='account'), # <-- This looks corre
    path('account/', account_view, name='account'),  # Added the account endpoint
]
