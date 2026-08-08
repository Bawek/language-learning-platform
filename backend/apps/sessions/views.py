"""
Views for the sessions app.
"""
import logging
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import LearningSession
from .serializers import LearningSessionSerializer, SessionCreateSerializer, SessionSummarySerializer

logger = logging.getLogger(__name__)


class SessionListView(generics.ListCreateAPIView):
    """
    List user's sessions or create a new one.
    GET  /api/sessions/
    POST /api/sessions/
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SessionCreateSerializer
        return LearningSessionSerializer

    def get_queryset(self):
        return LearningSession.objects.filter(user=self.request.user).select_related('agent')

    def create(self, request, *args, **kwargs):
        serializer = SessionCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            session = serializer.save()
            return Response(
                LearningSessionSerializer(session).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SessionDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific session.
    GET   /api/sessions/<pk>/
    PATCH /api/sessions/<pk>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LearningSessionSerializer

    def get_queryset(self):
        return LearningSession.objects.filter(user=self.request.user).select_related('agent')


class SessionEndView(APIView):
    """
    End an active learning session and generate a summary.
    POST /api/sessions/<pk>/end/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            session = LearningSession.objects.get(pk=pk, user=request.user)
        except LearningSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not session.is_active:
            return Response(
                {'error': 'Session has already ended.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.is_active = False
        session.ended_at = timezone.now()

        # Accept optional summary from request body
        summary = request.data.get('summary', '')
        if summary:
            session.summary = summary

        session.save(update_fields=['is_active', 'ended_at', 'summary'])

        logger.info('Session %s ended for user %s', pk, request.user.username)

        return Response(
            SessionSummarySerializer(session).data,
            status=status.HTTP_200_OK,
        )
