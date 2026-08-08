"""
JWT Authentication middleware for Django Channels WebSocket connections.
Authenticates WebSocket connections using a JWT token passed as a query parameter.
"""
import logging
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_str: str):
    """Validate JWT token and return the corresponding user."""
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

        token = AccessToken(token_str)
        user_id = token.get('user_id')
        if user_id is None:
            return AnonymousUser()
        user = User.objects.get(id=user_id)
        return user
    except Exception as exc:
        logger.warning('WebSocket JWT auth failed: %s', exc)
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware that authenticates WebSocket connections via JWT token.
    Token should be passed as a query parameter: ?token=<access_token>
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        token_list = params.get('token', [])

        if token_list:
            token_str = token_list[0]
            scope['user'] = await get_user_from_token(token_str)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
