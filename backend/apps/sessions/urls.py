"""
URL patterns for the sessions app.
"""
from django.urls import path
from .views import SessionListView, SessionDetailView, SessionEndView

urlpatterns = [
    path('', SessionListView.as_view(), name='session-list'),
    path('<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('<int:pk>/end/', SessionEndView.as_view(), name='session-end'),
]
