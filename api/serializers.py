# serializers.py
from rest_framework import serializers
from .models import Transaction, Person, Token, Category, CategoryLimit, SavingsGoal
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
        fields = ['id', 'name', 'description', 'user_id']

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
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    months_remaining = serializers.ReadOnlyField()
    is_on_track = serializers.ReadOnlyField()
    
    class Meta:
        model = SavingsGoal
        fields = [
            'id', 'user', 'name', 'target_amount', 'current_amount', 
            'monthly_contribution', 'deadline', 'status', 'created_at', 
            'updated_at', 'last_contribution_date', 'progress_percentage', 
            'months_remaining', 'is_on_track', 'category'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'last_contribution_date', 'category']

    def validate(self, data):
        # Validate target amount
        if data.get('target_amount', 0) <= 0:
            raise serializers.ValidationError("Target amount must be greater than 0")
        
        # Validate monthly contribution
        if data.get('monthly_contribution', 0) <= 0:
            raise serializers.ValidationError("Monthly contribution must be greater than 0")
        
        return data