# serializers.py
from rest_framework import serializers
from .models import Transaction, Person, Token
from django.contrib.auth.hashers import make_password 

class TokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = ["token", "created_at", "expires_at", "user_id", "is_used"]

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'user', 'category', 'amount', 'date', 'description', 'is_income']
        read_only_fields = ['id', 'user', 'date']  # user/date set automatically

class RegisterSerializer(serializers.ModelSerializer):
    repassword = serializers.CharField(write_only=True)

    class Meta:
        model = Person
        fields = ['username', 'name', 'income', 'birthday', 'password', 'repassword']

    def validate(self, data):
        if data['password'] != data['repassword']:
            raise serializers.ValidationError("Passwords do not match!")
        return data

    def create(self, validated_data):
        validated_data.pop('repassword')
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)
