from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from .models import Person
import jwt
from django.conf import settings

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication for Person model instead of Django's User model
    """
    
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        """
        try:
            user_id = validated_token.get('user_id')
            if user_id is None:
                print(f"DEBUG: No user_id in token. Token contents: {validated_token}")
                return None
            
            print(f"DEBUG: Looking for user with id: {user_id}")
            user = Person.objects.get(id=user_id)
            print(f"DEBUG: Found user: {user.username}")
            return user
        except Person.DoesNotExist:
            print(f"DEBUG: Person with id {user_id} does not exist")
            return None
        except Exception as e:
            print(f"DEBUG: Exception in get_user: {e}")
            return None

    def authenticate(self, request):
        """
        Returns a two-tuple of `User` and token if a valid signature has been
        supplied using JWT-based authentication. Otherwise returns `None`.
        """
        print(f"DEBUG: authenticate() called")
        print(f"DEBUG: Request headers: {dict(request.headers)}")
        
        header = self.get_header(request)
        print(f"DEBUG: Authorization header: {header}")
        
        if header is None:
            print("DEBUG: No authorization header found")
            return None

        raw_token = self.get_raw_token(header)
        print(f"DEBUG: Raw token extracted: {raw_token[:50] if raw_token else None}...")
        
        if raw_token is None:
            print("DEBUG: Could not extract raw token")
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            print(f"DEBUG: Token validated successfully")
        except (InvalidToken, TokenError) as e:
            print(f"DEBUG: Token validation failed: {e}")
            raise
        
        user = self.get_user(validated_token)
        
        if user is None:
            print("DEBUG: get_user returned None")
            return None
        
        print(f"DEBUG: Authentication successful for user: {user.username}")
        return (user, validated_token)