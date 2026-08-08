"""
Main URL configuration for language-learning-platform.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/agents/', include('apps.agents.urls')),
    path('api/sessions/', include('apps.sessions.urls')),
    path('api/conversations/', include('apps.conversations.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin site customization
admin.site.site_header = 'LinguaAI Administration'
admin.site.site_title = 'LinguaAI Admin'
admin.site.index_title = 'Welcome to LinguaAI Administration'
