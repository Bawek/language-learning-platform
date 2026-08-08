"""
URL patterns for the conversations app.
"""
from django.urls import path
from .views import MessageListView

urlpatterns = [
    path('sessions/<int:session_id>/messages/', MessageListView.as_view(), name='message-list'),
]
