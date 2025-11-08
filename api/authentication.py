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
                return None
            
            user = Person.objects.get(id=user_id)
            return user
        except Person.DoesNotExist:
            return None
        except Exception as e:
            return None

    def authenticate(self, request):
        """
        Returns a two-tuple of `User` and token if a valid signature has been
        supplied using JWT-based authentication. Otherwise returns `None`.
        """
        
        header = self.get_header(request)
        
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError) as e:
            raise
        
        user = self.get_user(validated_token)
        
        if user is None:
            return None
        
        return (user, validated_token)