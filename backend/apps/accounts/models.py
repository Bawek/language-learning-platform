"""
Custom User model for the language learning platform.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Extended user model with language learning profile fields.
    """
    LANGUAGE_CHOICES = [
        ('english', 'English'),
        ('spanish', 'Spanish'),
        ('french', 'French'),
        ('german', 'German'),
        ('japanese', 'Japanese'),
        ('mandarin', 'Mandarin Chinese'),
        ('portuguese', 'Portuguese'),
        ('italian', 'Italian'),
        ('korean', 'Korean'),
        ('arabic', 'Arabic'),
    ]

    PROFICIENCY_CHOICES = [
        ('A1', 'A1 - Beginner'),
        ('A2', 'A2 - Elementary'),
        ('B1', 'B1 - Intermediate'),
        ('B2', 'B2 - Upper Intermediate'),
        ('C1', 'C1 - Advanced'),
        ('C2', 'C2 - Mastery'),
    ]

    email = models.EmailField(unique=True)
    target_language = models.CharField(
        max_length=20,
        choices=LANGUAGE_CHOICES,
        default='english',
        help_text='The language the user is learning',
    )
    native_language = models.CharField(
        max_length=20,
        choices=LANGUAGE_CHOICES,
        default='english',
        help_text='The user\'s native language',
    )
    proficiency_level = models.CharField(
        max_length=2,
        choices=PROFICIENCY_CHOICES,
        default='A1',
        help_text='Current proficiency level in the target language',
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text='Profile avatar image',
    )
    bio = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.username} ({self.email})'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.username
