INSTALLED_APPS = [
    # ...existing code...
    'corsheaders',
    # ...existing code...
]

MIDDLEWARE = [
    # ...existing code...
    'corsheaders.middleware.CorsMiddleware',
    # ...existing code...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",  # Add your front-end URL here
    # Add other allowed origins if needed
]
