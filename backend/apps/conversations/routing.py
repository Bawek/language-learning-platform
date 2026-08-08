"""
WebSocket URL routing for the conversations app.
"""
from django.urls import re_path
from .consumers import ConversationConsumer, AudioConsumer

websocket_urlpatterns = [
    re_path(r'ws/conversation/(?P<session_id>\w+)/$', ConversationConsumer.as_asgi()),
    re_path(r'ws/audio/(?P<session_id>\w+)/$', AudioConsumer.as_asgi()),
]
