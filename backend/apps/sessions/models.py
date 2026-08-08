"""
Learning session models.
"""
from django.db import models
from django.conf import settings


class LearningSession(models.Model):
    """
    Represents a single language learning session between a user and an AI agent.
    Tracks conversation mode, progress metrics, and session outcomes.
    """
    MODE_CHOICES = [
        ('audio', 'Audio'),
        ('text', 'Text'),
        ('video', 'Video'),
    ]

    PROFICIENCY_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Mastery'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions',
    )
    agent = models.ForeignKey(
        'agents.AIAgent',
        on_delete=models.SET_NULL,
        null=True,
        related_name='sessions',
    )
    mode = models.CharField(
        max_length=10,
        choices=MODE_CHOICES,
        default='text',
    )
    target_language = models.CharField(
        max_length=20,
        help_text='The language being practiced in this session',
    )
    proficiency_level = models.CharField(
        max_length=2,
        choices=PROFICIENCY_CHOICES,
        default='A1',
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Progress tracking
    grammar_mistakes = models.JSONField(
        default=list,
        help_text='List of grammar mistakes made during the session',
    )
    new_vocabulary = models.JSONField(
        default=list,
        help_text='New vocabulary words encountered during the session',
    )
    pronunciation_scores = models.JSONField(
        default=dict,
        help_text='Pronunciation scores per word/phrase',
    )
    total_messages = models.IntegerField(default=0)
    summary = models.TextField(
        blank=True,
        default='',
        help_text='AI-generated session summary',
    )

    class Meta:
        db_table = 'sessions_learningsession'
        verbose_name = 'Learning Session'
        verbose_name_plural = 'Learning Sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.user.username} - {self.agent} - {self.mode} ({self.started_at:%Y-%m-%d})'

    @property
    def duration_minutes(self):
        if self.ended_at and self.started_at:
            delta = self.ended_at - self.started_at
            return round(delta.total_seconds() / 60, 1)
        return None
