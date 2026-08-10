"""
Serializers for the sessions app.
"""
from rest_framework import serializers
from apps.agents.serializers import AIAgentListSerializer
from .models import LearningSession


class LearningSessionSerializer(serializers.ModelSerializer):
    """Full serializer for LearningSession."""
    agent_detail = AIAgentListSerializer(source='agent', read_only=True)
    duration_minutes = serializers.ReadOnlyField()
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LearningSession
        fields = [
            'id', 'user', 'user_username', 'agent', 'agent_detail',
            'mode', 'target_language', 'proficiency_level',
            'started_at', 'ended_at', 'is_active',
            'grammar_mistakes', 'new_vocabulary', 'pronunciation_scores',
            'total_messages', 'summary', 'duration_minutes',
        ]
        read_only_fields = [
            'id', 'user', 'started_at', 'ended_at',
            'grammar_mistakes', 'new_vocabulary', 'pronunciation_scores',
            'total_messages', 'summary', 'duration_minutes',
        ]


class SessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new learning session."""
    target_language = serializers.CharField(required=False)
    proficiency_level = serializers.CharField(required=False)

    class Meta:
        model = LearningSession
        fields = ['agent', 'mode', 'target_language', 'proficiency_level']

    def validate_agent(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError('This agent is not currently available.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        # Use user's current settings as defaults if not provided
        validated_data.setdefault('target_language', user.target_language)
        validated_data.setdefault('proficiency_level', user.proficiency_level)
        return LearningSession.objects.create(user=user, **validated_data)


class SessionSummarySerializer(serializers.ModelSerializer):
    """Serializer for session summary data."""
    duration_minutes = serializers.ReadOnlyField()

    class Meta:
        model = LearningSession
        fields = [
            'id', 'mode', 'target_language', 'proficiency_level',
            'started_at', 'ended_at', 'is_active',
            'grammar_mistakes', 'new_vocabulary', 'pronunciation_scores',
            'total_messages', 'summary', 'duration_minutes',
        ]
        read_only_fields = fields
