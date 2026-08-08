"""
Admin configuration for the accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for the extended User model."""
    list_display = [
        'username', 'email', 'target_language', 'proficiency_level',
        'is_active', 'is_staff', 'created_at',
    ]
    list_filter = [
        'is_active', 'is_staff', 'target_language', 'proficiency_level', 'created_at',
    ]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email', 'bio', 'avatar')}),
        (_('Language Learning'), {
            'fields': ('target_language', 'native_language', 'proficiency_level'),
        }),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions',
            ),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username', 'email', 'password1', 'password2',
                'target_language', 'native_language', 'proficiency_level',
            ),
        }),
    )
