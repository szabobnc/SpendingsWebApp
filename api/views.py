from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TransactionSerializer, RegisterSerializer, CategorySerializer, PersonSerializer
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Person, Token, Category, Transaction
from datetime import datetime, timedelta
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
            serializer.save(user=user)  # associate transaction with logged-in user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

'''class RegistrationView(APIView):
    def post(self, request, format=None):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"success": True, "message": "You are now registered on our website!"},
                status=status.HTTP_200_OK,
            )
        else:
            error = ""
            for key in serializer.errors:
                error += serializer.errors[key][0]
            return Response(
                {"success": False, "message": error},
                status=status.HTTP_200_OK,
            )'''

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
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
def createCategory(request):
    try:
        name = request.data.get('name')
        description = request.data.get('description', '')

        if not name:
            return Response({"error": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

        category = Category.objects.create(name=name, description=description)
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