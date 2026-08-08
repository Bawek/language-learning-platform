"""
URL patterns for the agents app.
"""
from django.urls import path
from .views import AgentListView, AgentDetailView

urlpatterns = [
    path('', AgentListView.as_view(), name='agent-list'),
    path('<int:pk>/', AgentDetailView.as_view(), name='agent-detail'),
]
