"""
Serializers for the conversations app.
"""
from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for conversation messages."""

    class Meta:
        model = Message
        fields = [
            'id', 'session', 'role', 'content', 'audio_url',
            'mode', 'feedback', 'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']


class MessageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating messages via the REST API (non-WebSocket path)."""

    class Meta:
        model = Message
        fields = ['role', 'content', 'mode', 'feedback']

    def create(self, validated_data):
        session = self.context['session']
        return Message.objects.create(session=session, **validated_data)
