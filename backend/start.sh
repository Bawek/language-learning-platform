#!/bin/bash
# Railway/Render startup script for Daphne ASGI server

# Get PORT from environment, default to 8000
PORT=${PORT:-8000}

echo "Starting Daphne on port $PORT..."

# Start Daphne with the configured port
exec daphne -b 0.0.0.0 -p $PORT config.asgi:application
