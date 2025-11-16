from django.urls import path
from .views import (
    RegistrationView, 
    LoginView, 
    GetCategoriesView, 
    TransactionCreateView,
    account_view,
    category_limit_list,
    category_limit_detail,
    check_category_spending,
    savings_goal_list,
    savings_goal_detail,
    process_monthly_contributions,
    force_monthly_contributions
)
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import transaction_list

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("getCategories/", GetCategoriesView.as_view(), name="getCategories"),
    path("createTransaction/", TransactionCreateView.as_view(), name="create_transaction"),
    path('transactions/', transaction_list, name='transaction-list'),
    path('createCategory/', views.createCategory, name='createCategory'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction-detail'),
    path('account/', account_view, name='account'),
    path('history/', views.transaction_history, name='transaction-list'),

    
    # Category Limit endpoints
    path('category-limits/', category_limit_list, name='category-limit-list'),
    path('category-limits/<int:pk>/', category_limit_detail, name='category-limit-detail'),
    path('category-spending/<int:category_id>/', check_category_spending, name='check-category-spending'),
    
    # Savings Goal endpoints
    path('savings-goals/', savings_goal_list, name='savings-goal-list'),
    path('savings-goals/<int:pk>/', savings_goal_detail, name='savings-goal-detail'),
    path('savings-goals/process-contributions/', process_monthly_contributions, name='process-monthly-contributions'),
    path('savings-goals/force-contributions/', force_monthly_contributions, name='force-monthly-contributions'),
]