"""
Serializers for the agents app.
"""
from rest_framework import serializers
from .models import AIAgent


class AIAgentSerializer(serializers.ModelSerializer):
    """Full serializer for AIAgent model."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = AIAgent
        fields = [
            'id', 'name', 'persona', 'role', 'role_display',
            'accent', 'dialect', 'supported_languages',
            'difficulty_scaling', 'is_active', 'avatar_url',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AIAgentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing agents."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = AIAgent
        fields = [
            'id', 'name', 'persona', 'role', 'role_display',
            'accent', 'supported_languages', 'avatar_url', 'is_active',
        ]
