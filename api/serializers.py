# serializers.py
from rest_framework import serializers
from .models import Transaction, Person, Token, Category, CategoryLimit
from django.contrib.auth.hashers import make_password 

class TokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = ["token", "created_at", "expires_at", "user_id", "is_used"]

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', default="No category", read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'category', 'category_name', 'amount', 'date', 'description', 'is_income']
        read_only_fields = ['id', 'user', 'date']


'''class RegisterSerializer(serializers.ModelSerializer):
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
        return super().create(validated_data)'''

class RegisterSerializer(serializers.ModelSerializer):
    repassword = serializers.CharField(write_only=True)

    class Meta:
        model = Person
        fields = ['username', 'name', 'income', 'birthday', 'password', 'repassword']
        extra_kwargs = {
            'password': {'write_only': True},
            'income': {'required': False},
            'birthday': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        if data['password'] != data['repassword']:
            raise serializers.ValidationError("Passwords do not match!")
        return data

    def create(self, validated_data):
        # Remove repassword from validated data
        validated_data.pop('repassword')
        
        # Hash the password
        validated_data['password'] = make_password(validated_data['password'])
        
        # Set default values for optional fields
        if 'income' not in validated_data:
            validated_data['income'] = 0
        if 'birthday' not in validated_data:
            validated_data['birthday'] = None
            
        return super().create(validated_data)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'username', 'name', 'income', 'birthday', 'is_premium']
        read_only_fields = ['id', 'username', 'birthday']

class CategoryLimitSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = CategoryLimit
        fields = ['id', 'user', 'category', 'category_name', 'limit_amount', 'created_at', 'updated_at']
        # --- CHANGE HERE ---
        # Add 'user' to read_only_fields
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']