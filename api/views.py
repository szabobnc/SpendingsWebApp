from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TransactionSerializer, RegisterSerializer, CategorySerializer
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Person, Token, Category, Transaction
from datetime import datetime, timedelta
import hashlib
import uuid
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction
from .serializers import TransactionSerializer

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

class RegistrationView(APIView):
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

        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
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
