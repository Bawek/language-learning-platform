"""
Development Django settings.
"""
from .base import *  # noqa: F401, F403

DEBUG = True

# In development, allow all hosts
ALLOWED_HOSTS = ['*']

# SQLite for quick development (switch to PostgreSQL if needed)
import os
import environ

env = environ.Env()
_db_url = env('DATABASE_URL', default='')

if _db_url:
    DATABASES = {
        'default': env.db('DATABASE_URL')
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',  # noqa: F405
        }
    }

# CORS: allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Additional development apps
INSTALLED_APPS += ['django.contrib.admindocs']  # noqa: F405

# Disable password hashing speed for faster tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Show emails in console during development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Django Debug Toolbar (optional, commented out)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']

# Verbose logging in development
LOGGING['root']['level'] = 'DEBUG'  # noqa: F405
LOGGING['loggers']['apps']['level'] = 'DEBUG'  # noqa: F405
LOGGING['loggers']['services']['level'] = 'DEBUG'  # noqa: F405
