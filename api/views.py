from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    TransactionSerializer, RegisterSerializer, CategorySerializer, 
    PersonSerializer, CategoryLimitSerializer, SavingsGoalSerializer
)
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Person, Token, Category, Transaction, CategoryLimit, SavingsGoal
from datetime import datetime, timedelta, date
import hashlib
import uuid
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction
from .serializers import TransactionSerializer
from rest_framework.permissions import IsAuthenticated
from .authentication import CustomJWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.db.models import Sum, F

@api_view(['GET', 'PATCH', 'DELETE'])
def transaction_detail(request, pk):
    try:
        transaction = Transaction.objects.get(pk=pk)
    except Transaction.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = TransactionSerializer(transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransactionCreateView(APIView):
    def post(self, request):
        data = request.data.copy()
        user_id = data.get("user")
        try:
            user = Person.objects.get(id=user_id)
        except Person.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TransactionSerializer(data=data)
        if serializer.is_valid():
            transaction = serializer.save(user=user)
            
            # Check if this is an expense and if user has premium and category limit set
            if not transaction.is_income and transaction.category and user.is_premium:
                # Get the current month's start and end
                now = timezone.now()
                month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                
                # Check if there's a limit for this category
                try:
                    category_limit = CategoryLimit.objects.get(user=user, category=transaction.category)
                    
                    # Calculate total spending in this category for current month
                    total_spent = Transaction.objects.filter(
                        user=user,
                        category=transaction.category,
                        is_income=False,
                        date__gte=month_start
                    ).aggregate(total=Sum('amount'))['total'] or 0
                    
                    # Check if limit is exceeded
                    limit_amount = category_limit.limit_amount
                    percentage = (total_spent / limit_amount) * 100 if limit_amount > 0 else 0
                    
                    response_data = serializer.data
                    response_data['limit_check'] = {
                        'has_limit': True,
                        'limit_amount': limit_amount,
                        'total_spent': total_spent,
                        'remaining': limit_amount - total_spent,
                        'percentage': round(percentage, 2),
                        'exceeded': total_spent > limit_amount,
                        'warning': percentage >= 80
                    }
                    
                    return Response(response_data, status=status.HTTP_201_CREATED)
                    
                except CategoryLimit.DoesNotExist:
                    pass
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegistrationView(APIView):
    def post(self, request, format=None):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                return Response(
                    {"success": True, "message": "You are now registered on our website!"},
                    status=status.HTTP_201_CREATED,
                )
            else:
                error_messages = []
                for field, errors in serializer.errors.items():
                    for error in errors:
                        error_messages.append(f"{field}: {error}")
                error_message = "; ".join(error_messages)
                return Response(
                    {"success": False, "message": error_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            print(f"RRRRRRegistration error: {e}")
            return Response(
                {"success": False, "message": "Internal server error during registration"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class LoginView(APIView):
    def post(self, request, format=None):
        username = request.data.get("username")
        password = request.data.get("password")

        try:
            user = Person.objects.get(username=username)
        except Person.DoesNotExist:
            return Response({'error': 'Invalid username or password!'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not check_password(password, user.password):
            return Response({'error': 'Invalid username or password!'}, status=status.HTTP_401_UNAUTHORIZED)

        # Create a custom token payload for our Person model
        refresh = RefreshToken()
        refresh['user_id'] = user.id
        refresh['username'] = user.username
        
        access_token = refresh.access_token
        access_token['user_id'] = user.id
        access_token['username'] = user.username

        return Response({
            'refresh': str(refresh),
            'access': str(access_token),
            'user': {
                'id': user.id,
                'name': getattr(user, 'name', ''),
            }
        })

class GetCategoriesView(APIView):
    def get(self, request, format=None): 
        print('GET Categories called with params:', request.GET.get('user_id'))  
        user = Person.objects.get(id=request.GET.get('user_id'))
        categories = Category.objects.filter(user=user)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
def createCategory(request):
    try:
        name = request.data.get('name')
        user_id = request.data.get('user_id')
        description = request.data.get('description', '')

        if not name:
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_id:
            return Response({"error": "User is required"}, status=status.HTTP_400_BAD_REQUEST)

        user = Person.objects.get(id=user_id)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        

        category = Category.objects.create(name=name, user=user, description=description)
        return Response({"id": category.id, "name": category.name, "description": category.description}, status=status.HTTP_201_CREATED)

    except Exception as e:
        print("Error creating category:", e)
        return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
def transaction_list(request):
    user_id = request.GET.get('user_id')
    month_index = request.GET.get('date')
    if not user_id:
        return Response({"error": "user_id is required"}, status=400)

    try:
        user = Person.objects.get(id=user_id)
    except Person.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    transactions = Transaction.objects.filter(user=user)

    if month_index is not None:
        try:
            month = int(month_index) + 1
            transactions = transactions.filter(date__month=month)
        except ValueError:
            return Response({"error": "Invalid date parameter"}, status=400)


    transactions = transactions.order_by('-date')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def transaction_history(request):

    user_id = request.GET.get('user_id')
    amount = request.GET.get('amount')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    description = request.GET.get('description')
    is_income = request.GET.get('is_income')
    category_id = request.GET.get('category_id')

    queryset = Transaction.objects.filter(user_id=user_id)

    if amount:
        queryset = queryset.filter(amount=amount)

    if date_from:
        queryset = queryset.filter(date__date__gte=date_from)

    if date_to:
        queryset = queryset.filter(date__date__lte=date_to)

    if description:
        queryset = queryset.filter(description__icontains=description)

    if is_income in ['0', '1']:
        queryset = queryset.filter(is_income=bool(int(is_income)))

    if category_id:
        queryset = queryset.filter(category_id=category_id)

    serializer = TransactionSerializer(queryset, many=True)
    return Response({'data': serializer.data})

@api_view(['GET', 'PATCH'])
def account_view(request):
    """
    Handles retrieval (GET) and updating (PATCH) of the authenticated user's account details.
    Uses custom JWT authentication for Person model.
    """
    # Use custom authentication
    auth = CustomJWTAuthentication()
    
    try:
        # Attempt to authenticate the request
        auth_result = auth.authenticate(request)
        
        # If authentication returns None, no credentials were provided
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user, token = auth_result
        
        # Double-check user is valid
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {'error': f'Authentication error: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if request.method == 'GET':
        serializer = PersonSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Use partial=True to allow updating only a subset of fields (like is_premium)
        serializer = PersonSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Category Limit Views
@api_view(['GET', 'POST'])
def category_limit_list(request):
    """
    GET: List all category limits for the authenticated user
    POST: Create a new category limit
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is premium
    if not user.is_premium:
        return Response(
            {'error': 'This feature is only available for premium users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        limits = CategoryLimit.objects.filter(user=user)
        serializer = CategoryLimitSerializer(limits, many=True)
        
        # Add spending info for each limit
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        limits_data = []
        for limit_data in serializer.data:
            category_id = limit_data['category']
            total_spent = Transaction.objects.filter(
                user=user,
                category_id=category_id,
                is_income=False,
                date__gte=month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            limit_amount = limit_data['limit_amount']
            percentage = (total_spent / limit_amount) * 100 if limit_amount > 0 else 0
            
            limit_data['current_spending'] = {
                'total_spent': total_spent,
                'remaining': limit_amount - total_spent,
                'percentage': round(percentage, 2),
                'exceeded': total_spent > limit_amount,
                'warning': percentage >= 80
            }
            limits_data.append(limit_data)
        
        return Response(limits_data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        data = request.data.copy()
        # The user is already authenticated and available as 'user'
        
        # Check if limit already exists for this category
        category_id = data.get('category')
        existing_limit = CategoryLimit.objects.filter(user=user, category_id=category_id).first()
        
        if existing_limit:
            # Update existing limit
            serializer = CategoryLimitSerializer(existing_limit, data=data, partial=True)
            if serializer.is_valid():
                serializer.save(user=user) # Pass user explicitly
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create new limit
            serializer = CategoryLimitSerializer(data=data)
            if serializer.is_valid():
                serializer.save(user=user) # Pass user explicitly
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
def category_limit_detail(request, pk):
    """
    GET: Retrieve a specific category limit
    PATCH: Update a category limit
    DELETE: Delete a category limit
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        limit = CategoryLimit.objects.get(pk=pk, user=user)
    except CategoryLimit.DoesNotExist:
        return Response(
            {'error': 'Category limit not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = CategoryLimitSerializer(limit)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        serializer = CategoryLimitSerializer(limit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        limit.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
def check_category_spending(request, category_id):
    """
    Check current spending against limit for a specific category
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return Response(
            {'error': 'Category not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get current month's spending
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total_spent = Transaction.objects.filter(
        user=user,
        category=category,
        is_income=False,
        date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Check if there's a limit
    try:
        limit = CategoryLimit.objects.get(user=user, category=category)
        limit_amount = limit.limit_amount
        percentage = (total_spent / limit_amount) * 100 if limit_amount > 0 else 0
        
        return Response({
            'category_id': category_id,
            'category_name': category.name,
            'has_limit': True,
            'limit_amount': limit_amount,
            'total_spent': total_spent,
            'remaining': limit_amount - total_spent,
            'percentage': round(percentage, 2),
            'exceeded': total_spent > limit_amount,
            'warning': percentage >= 80
        }, status=status.HTTP_200_OK)
        
    except CategoryLimit.DoesNotExist:
        return Response({
            'category_id': category_id,
            'category_name': category.name,
            'has_limit': False,
            'total_spent': total_spent
        }, status=status.HTTP_200_OK)


# Helper function to calculate current balance
def calculate_current_balance(user):
    """Calculate user's current balance for the current month"""
    current_date = timezone.now()
    month_start = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Calculate balance
    monthly_income = user.income
    extra_income = Transaction.objects.filter(
        user=user, is_income=True, date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    expenses = Transaction.objects.filter(
        user=user, is_income=False, date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    return monthly_income + extra_income - expenses


# Savings Goal Views
@api_view(['GET', 'POST'])
def savings_goal_list(request):
    """
    GET: List all savings goals for the authenticated user
    POST: Create a new savings goal with automatic first contribution
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is premium
    if not user.is_premium:
        return Response(
            {'error': 'Savings goals are only available for premium users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        goals = SavingsGoal.objects.filter(user=user).order_by('-created_at')
        serializer = SavingsGoalSerializer(goals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        # Check if user already has 3 active goals
        active_goals_count = SavingsGoal.objects.filter(user=user, status='active').count()
        if active_goals_count >= 3:
            return Response(
                {'error': 'You can only have up to 3 active savings goals'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the monthly contribution amount
        monthly_contribution = request.data.get('monthly_contribution')
        if not monthly_contribution:
            return Response(
                {'error': 'Monthly contribution is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        monthly_contribution = int(monthly_contribution)
        
        # Calculate current balance
        current_balance = calculate_current_balance(user)
        
        # Check if monthly contribution is more than 1/3 of balance
        one_third_balance = current_balance / 3
        force_create = request.data.get('force_create', False)
        
        if monthly_contribution > one_third_balance and not force_create:
            return Response({
                'requires_confirmation': True,
                'message': f'Your monthly contribution ({monthly_contribution} Ft) is more than 1/3 of your current balance ({current_balance:.2f} Ft). This may affect your spending capacity.',
                'current_balance': current_balance,
                'monthly_contribution': monthly_contribution,
                'one_third_balance': round(one_third_balance, 2)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the goal
        serializer = SavingsGoalSerializer(data=request.data)
        if serializer.is_valid():
            goal = serializer.save(user=user)
            
            # Create a category for this savings goal
            
            category, created = Category.objects.get_or_create(
                name=goal.name,
                user=goal.user,
                defaults={'description': f'Savings goal category for {goal.name}'}
            )
            goal.category = category
            goal.save()
            
            # Automatically process the first contribution
            current_date = timezone.now()
            contribution_amount = min(monthly_contribution, goal.target_amount)
            
            # Update goal with first contribution
            goal.current_amount = contribution_amount
            goal.last_contribution_date = current_date.date()
            
            # Mark as completed if target reached immediately
            if goal.current_amount >= goal.target_amount:
                goal.status = 'completed'
            
            goal.save()
            
            # Create transaction record for the first contribution
            Transaction.objects.create(
                user=user,
                amount=contribution_amount,
                description=f"Initial contribution to savings goal: {goal.name}",
                is_income=False,
                category=category
            )
            
            # Return the updated goal
            updated_serializer = SavingsGoalSerializer(goal)
            response_data = updated_serializer.data
            response_data['first_contribution_processed'] = True
            response_data['contribution_amount'] = contribution_amount
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
def savings_goal_detail(request, pk):
    """
    GET: Retrieve a specific savings goal
    PATCH: Update a savings goal
    DELETE: Delete a savings goal
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        goal = SavingsGoal.objects.get(pk=pk, user=user)
    except SavingsGoal.DoesNotExist:
        return Response(
            {'error': 'Savings goal not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = SavingsGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        serializer = SavingsGoalSerializer(goal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete all transactions associated with this savings goal's category
        if goal.category:
            Transaction.objects.filter(user=user, category=goal.category).delete()
            # Optionally delete the category as well (or keep it for history)
            # goal.category.delete()
        
        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def process_monthly_contributions(request):
    """
    Process monthly contributions for all active savings goals
    This should be called by a cron job or management command
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_premium:
        return Response(
            {'error': 'This feature is only available for premium users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get user's current balance
    current_balance = calculate_current_balance(user)
    
    # Get active goals that need contribution
    current_date = timezone.now()
    active_goals = SavingsGoal.objects.filter(
        user=user, 
        status='active',
        current_amount__lt=F('target_amount')
    )
    
    results = []
    total_required = sum(goal.monthly_contribution for goal in active_goals)
    
    # Check if monthly contribution is MORE than 1/3 of balance
    one_third_balance = current_balance / 3
    
    if total_required > one_third_balance:
        return Response({
            'success': False,
            'message': f'Warning: Your monthly contribution ({total_required} Ft) is more than 1/3 of your current balance ({current_balance} Ft). This may affect your spending capacity.',
            'current_balance': current_balance,
            'total_contribution': total_required,
            'one_third_balance': round(one_third_balance, 2),
            'requires_permission': True
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Process contributions for each goal
    for goal in active_goals:
        # Check if already contributed this month
        if (goal.last_contribution_date and 
            goal.last_contribution_date.month == current_date.month and
            goal.last_contribution_date.year == current_date.year):
            continue
        
        # Calculate contribution amount (don't exceed target)
        remaining_amount = goal.target_amount - goal.current_amount
        contribution_amount = min(goal.monthly_contribution, remaining_amount)
        
        # Update goal
        goal.current_amount += contribution_amount
        goal.last_contribution_date = current_date.date()
        
        # Mark as completed if target reached
        if goal.current_amount >= goal.target_amount:
            goal.status = 'completed'
        
        goal.save()
        
        # Create transaction record
        Transaction.objects.create(
            user=user,
            amount=contribution_amount,
            description=f"Automatic contribution to savings goal: {goal.name}",
            is_income=False,
            category=goal.category
        )
        
        results.append({
            'goal_id': goal.id,
            'goal_name': goal.name,
            'contribution_amount': contribution_amount,
            'new_total': goal.current_amount,
            'completed': goal.status == 'completed'
        })
    
    return Response({
        'success': True,
        'message': f'Successfully processed contributions for {len(results)} goals',
        'contributions': results,
        'total_contributed': sum(r['contribution_amount'] for r in results)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def force_monthly_contributions(request):
    """
    Force process monthly contributions even with insufficient balance
    """
    auth = CustomJWTAuthentication()
    
    try:
        auth_result = auth.authenticate(request)
        if auth_result is None:
            return Response(
                {'error': 'Authentication credentials were not provided'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        user, token = auth_result
        
        if user is None:
            return Response(
                {'error': 'Invalid authentication credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except (InvalidToken, TokenError) as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_premium:
        return Response(
            {'error': 'This feature is only available for premium users'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get active goals that need contribution
    current_date = timezone.now()
    active_goals = SavingsGoal.objects.filter(
        user=user, 
        status='active',
        current_amount__lt=F('target_amount')
    )
    
    results = []
    
    # Process contributions for each goal
    for goal in active_goals:
        # Check if already contributed this month
        if (goal.last_contribution_date and 
            goal.last_contribution_date.month == current_date.month and
            goal.last_contribution_date.year == current_date.year):
            continue
        
        # Calculate contribution amount (don't exceed target)
        remaining_amount = goal.target_amount - goal.current_amount
        contribution_amount = min(goal.monthly_contribution, remaining_amount)
        
        # Update goal
        goal.current_amount += contribution_amount
        goal.last_contribution_date = current_date.date()
        
        # Mark as completed if target reached
        if goal.current_amount >= goal.target_amount:
            goal.status = 'completed'
        
        goal.save()
        
        # Create transaction record
        Transaction.objects.create(
            user=user,
            amount=contribution_amount,
            description=f"Automatic contribution to savings goal: {goal.name} (forced)",
            is_income=False,
            category=None
        )
        
        results.append({
            'goal_id': goal.id,
            'goal_name': goal.name,
            'contribution_amount': contribution_amount,
            'new_total': goal.current_amount,
            'completed': goal.status == 'completed'
        })
    
    return Response({
        'success': True,
        'message': f'Successfully processed forced contributions for {len(results)} goals',
        'contributions': results,
        'total_contributed': sum(r['contribution_amount'] for r in results)
    }, status=status.HTTP_200_OK)