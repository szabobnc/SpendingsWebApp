from django.db import models
from django.contrib.auth.hashers import make_password

class Token(models.Model):
    id = models.AutoField(primary_key=True)
    token = models.CharField(max_length=255)
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    user_id = models.IntegerField()
    is_used = models.BooleanField(default=False)

class Category(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Person(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    income = models.IntegerField(default=0)
    password = models.CharField(max_length=255)  # hashed
    birthday = models.DateField()
    # Optional: is_premium field
    is_premium = models.BooleanField(default=False)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()

    def __str__(self):
        return self.username


class Transaction(models.Model):
    user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="transactions")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)
    is_income = models.BooleanField(default=False)  # distinguish income vs expense

    def __str__(self):
        return f"{self.user.username} - {self.amount}"


class SavingsGoal(models.Model):
    user = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="savings_goals")
    name = models.CharField(max_length=100)
    target_amount = models.IntegerField()
    current_amount = models.IntegerField(default=0)
    deadline = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
