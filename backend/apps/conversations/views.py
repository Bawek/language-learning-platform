"""
Views for the conversations app.
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.sessions.models import LearningSession
from .models import Message
from .serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    """
    List all messages for a given learning session.
    GET /api/conversations/sessions/<session_id>/messages/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        # Ensure the session belongs to the requesting user
        try:
            session = LearningSession.objects.get(id=session_id)
        except LearningSession.DoesNotExist:
            raise NotFound('Session not found.')

        if session.user != self.request.user:
            raise PermissionDenied('You do not have permission to view this session.')

        return Message.objects.filter(session=session).order_by('timestamp')
