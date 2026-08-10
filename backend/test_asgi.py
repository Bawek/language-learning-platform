"""
Quick diagnostic script to test ASGI application loading.
Run: python test_asgi.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

try:
    django.setup()
    print("✓ Django setup successful")
    
    from config.asgi import application
    print("✓ ASGI application imported successfully")
    print(f"  Application type: {type(application)}")
    
    from apps.conversations.routing import websocket_urlpatterns
    print(f"✓ WebSocket URL patterns loaded: {len(websocket_urlpatterns)} routes")
    
    for pattern in websocket_urlpatterns:
        print(f"  - {pattern.pattern}")
    
    print("\n✓ Everything looks good! Now run:")
    print("  daphne -b 0.0.0.0 -p 8000 config.asgi:application")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
