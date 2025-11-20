from django.db import models
from django.contrib.auth.hashers import make_password
from datetime import date
from dateutil.relativedelta import relativedelta
from django.utils import timezone

class Token(models.Model):
    id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    user_id = models.IntegerField()
    is_used = models.BooleanField(default=False)


class Person(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    income = models.IntegerField(default=0)
    password = models.CharField(max_length=255)  # hashed
    birthday = models.DateField(null=True, blank=True)
    is_premium = models.BooleanField(default=False)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()

    def __str__(self):
        return self.username

class Category(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="categories")


    def __str__(self):
        return self.name

class Transaction(models.Model):
    user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="transactions")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    savings_goal = models.ForeignKey('SavingsGoal', on_delete=models.CASCADE, null=True, blank=True, related_name='transactions')
    amount = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    is_income = models.BooleanField(default=False)  # distinguish income vs expense

    def __str__(self):
        return f"{self.user.username} - {self.amount}"

class SavingsGoal(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
    ]
    
    '''user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="savings_goals")
    name = models.CharField(max_length=100)
    target_amount = models.IntegerField()
    current_amount = models.IntegerField(default=0)
    monthly_contribution = models.IntegerField()
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_contribution_date = models.DateField(null=True, blank=True)'''
 
    user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="savings_goals")
    name = models.CharField(max_length=100)
    target_amount = models.IntegerField()
    current_amount = models.IntegerField(default=0)
    
    # CLEANUP 1: Remove temporary default (Assuming you want to require a value on creation)
    # If you want 0 to be the permanent default, keep it. 
    # To fix the immediate error, let's remove it for now.
    monthly_contribution = models.IntegerField() 
    
    deadline = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='savings_goals')
    
    # CLEANUP 2: REMOVE `default=timezone.now` from the line below!
    created_at = models.DateTimeField(auto_now_add=True) 
    
    updated_at = models.DateTimeField(auto_now=True)
    last_contribution_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
    @property
    def progress_percentage(self):
        if self.target_amount <= 0:
            return 0
        return min((self.current_amount / self.target_amount) * 100, 100)
    
    @property
    def months_remaining(self):
        if not self.deadline:
            return None
        today = date.today()
        if self.deadline <= today:
            return 0
        delta = relativedelta(self.deadline, today)
        return delta.years * 12 + delta.months
    
    @property
    def is_on_track(self):
        if not self.deadline or self.target_amount <= 0:
            return True
        
        months_remaining = self.months_remaining
        if months_remaining is None or months_remaining <= 0:
            return self.current_amount >= self.target_amount
        
        remaining_amount = self.target_amount - self.current_amount
        required_monthly = remaining_amount / months_remaining
        return self.monthly_contribution >= required_monthly

class CategoryLimit(models.Model):
    user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='category_limits')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    limit_amount = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category')

    def __str__(self):
        return f"{self.user.username} - {self.category.name}: {self.limit_amount}"