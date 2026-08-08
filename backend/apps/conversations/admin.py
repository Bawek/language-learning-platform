"""
Admin configuration for the conversations app.
"""
from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'mode', 'timestamp', 'has_feedback']
    list_filter = ['role', 'mode', 'timestamp']
    search_fields = ['content', 'session__user__username']
    readonly_fields = ['timestamp']
    raw_id_fields = ['session']

    def has_feedback(self, obj):
        return obj.feedback is not None
    has_feedback.boolean = True
    has_feedback.short_description = 'Has Feedback'
