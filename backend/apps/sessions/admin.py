"""
Admin configuration for the sessions app.
"""
from django.contrib import admin
from .models import LearningSession


@admin.register(LearningSession)
class LearningSessionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'agent', 'mode', 'target_language',
        'proficiency_level', 'is_active', 'started_at', 'duration_minutes',
    ]
    list_filter = ['mode', 'target_language', 'proficiency_level', 'is_active']
    search_fields = ['user__username', 'user__email', 'agent__name']
    readonly_fields = ['started_at', 'duration_minutes']
    raw_id_fields = ['user', 'agent']

    fieldsets = (
        ('Session Info', {
            'fields': ('user', 'agent', 'mode', 'target_language', 'proficiency_level'),
        }),
        ('Status', {
            'fields': ('is_active', 'started_at', 'ended_at', 'duration_minutes'),
        }),
        ('Progress', {
            'fields': ('grammar_mistakes', 'new_vocabulary', 'pronunciation_scores',
                       'total_messages', 'summary'),
            'classes': ('collapse',),
        }),
    )
