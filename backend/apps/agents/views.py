"""
Views for the agents app.
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import AIAgent
from .serializers import AIAgentSerializer, AIAgentListSerializer


class AgentListView(generics.ListAPIView):
    """
    List all active AI agents.
    GET /api/agents/
    Supports filtering by supported_language query param.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIAgentListSerializer

    def get_queryset(self):
        queryset = AIAgent.objects.filter(is_active=True)
        language = self.request.query_params.get('language')
        if language:
            # Filter agents that support the given language
            queryset = queryset.filter(supported_languages__contains=[language])
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class AgentDetailView(generics.RetrieveAPIView):
    """
    Retrieve details for a specific AI agent.
    GET /api/agents/<pk>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIAgentSerializer
    queryset = AIAgent.objects.filter(is_active=True)
