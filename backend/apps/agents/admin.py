"""
Admin configuration for the agents app.
"""
from django.contrib import admin
from .models import AIAgent


@admin.register(AIAgent)
class AIAgentAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'role', 'accent', 'is_active', 'difficulty_scaling', 'created_at',
    ]
    list_filter = ['role', 'is_active', 'difficulty_scaling']
    search_fields = ['name', 'persona']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'persona', 'role', 'avatar_url', 'is_active'),
        }),
        ('Language Settings', {
            'fields': ('accent', 'dialect', 'supported_languages', 'difficulty_scaling'),
        }),
        ('System Prompt', {
            'fields': ('system_prompt_template',),
            'classes': ('wide',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request)
