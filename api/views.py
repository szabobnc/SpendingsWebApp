from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import TransactionSerializer
from django.contrib.auth.hashers import make_password
from .serializers import RegisterSerializer, TokenSerializer
from .models import Person, Token
from datetime import datetime, timedelta
import hashlib
import uuid
from django.utils import timezone


SALT = "8b4f6b2cc1868d75ef79e5cfb8779c11b6a374bf0fce05b485581bf4e1e25b96c8c2855015de8449"


class TransactionCreateView(APIView):
    def post(self, request):
        serializer = TransactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # associate transaction with logged-in user
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegistrationView(APIView):
    def post(self, request, format=None):
        request.data["password"] = make_password(
            password=request.data["password"], salt=SALT
        )
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
        username = request.data["username"]
        password = request.data["password"]
        hashed_password = make_password(password=password, salt=SALT)
        user = Person.objects.filter(username=username).first()
        if user is None or user.password != hashed_password:
            return Response(
                {
                    "success": False,
                    "message": "Invalid Username or password!",
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"success": True, "message": "You are now logged in!"},
                status=status.HTTP_200_OK,
            )