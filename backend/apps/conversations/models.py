"""
Conversation / Message models.
"""
from django.db import models


class Message(models.Model):
    """
    Represents a single message in a learning session conversation.
    Stores both the content and any AI feedback associated with the message.
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    MODE_CHOICES = [
        ('audio', 'Audio'),
        ('text', 'Text'),
        ('video', 'Video'),
    ]

    session = models.ForeignKey(
        'sessions.LearningSession',
        on_delete=models.CASCADE,
        related_name='messages',
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    content = models.TextField(help_text='Text content of the message')
    audio_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='URL to stored audio file for this message',
    )
    mode = models.CharField(max_length=10, choices=MODE_CHOICES, default='text')
    feedback = models.JSONField(
        null=True,
        blank=True,
        default=None,
        help_text='Grammar corrections, suggestions, and pronunciation scores',
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'conversations_message'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['timestamp']

    def __str__(self):
        preview = self.content[:60] + '...' if len(self.content) > 60 else self.content
        return f'[{self.role}] {preview}'
