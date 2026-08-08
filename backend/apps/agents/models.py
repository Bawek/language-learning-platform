"""
AI Agent models for the language learning platform.
"""
from django.db import models


class AIAgent(models.Model):
    """
    Represents an AI language tutor persona that users can practice with.
    Each agent has a distinct teaching style, role, and language focus.
    """
    ROLE_CHOICES = [
        ('interviewer', 'Job Interviewer'),
        ('local_guide', 'Local Guide'),
        ('pronunciation_specialist', 'Pronunciation Specialist'),
        ('general', 'General Tutor'),
        ('debate_partner', 'Debate Partner'),
        ('storyteller', 'Storyteller'),
    ]

    name = models.CharField(max_length=100, help_text='Agent display name')
    persona = models.TextField(
        help_text='Description of the agent\'s personality and teaching style, '
                  'e.g. "The Encouraging Friend"',
    )
    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default='general',
    )
    accent = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Accent style, e.g. "American", "British RP", "Neutral"',
    )
    dialect = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Dialect, e.g. "Southern US", "Scottish"',
    )
    supported_languages = models.JSONField(
        default=list,
        help_text='List of language codes this agent supports, e.g. ["en", "es"]',
    )
    difficulty_scaling = models.BooleanField(
        default=True,
        help_text='Whether the agent automatically adjusts difficulty to user level',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this agent is available to users',
    )
    avatar_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='URL to the agent\'s avatar image',
    )
    system_prompt_template = models.TextField(
        help_text='Jinja2/format-string template for the system prompt. '
                  'Available variables: {target_language}, {proficiency_level}, {user_name}',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agents_aiagent'
        verbose_name = 'AI Agent'
        verbose_name_plural = 'AI Agents'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.get_role_display()})'

    def get_system_prompt(self, target_language: str, proficiency_level: str, user_name: str) -> str:
        """Render the system prompt with user-specific context."""
        try:
            return self.system_prompt_template.format(
                target_language=target_language,
                proficiency_level=proficiency_level,
                user_name=user_name,
                accent=self.accent,
                dialect=self.dialect,
                persona=self.persona,
                role=self.get_role_display(),
            )
        except KeyError:
            return self.system_prompt_template
