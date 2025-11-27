"""
Django settings for server project.
"""
from pathlib import Path
import os
import pymysql
import dj_database_url  # 👈 FALTABA ESTO

pymysql.install_as_MySQLdb()

AUTH_USER_MODEL = "accounts.User"

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-e&x2cjjsgvm8%-&45t(ldx)9+lx64ua^x-*gi_2bl&w_&af+$*'

# SECURITY WARNING: don't run with debug turned on in production!
# OJO: En producción idealmente esto debería ser False, pero para debuggear déjalo en True un momento.
DEBUG = True 

ALLOWED_HOSTS = ["*"]

# ----------------------------
# Application definition
# ----------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    "rest_framework",
    "corsheaders",
    "accounts",
    'chatbot.apps.ChatbotConfig',
    "rest_framework_simplejwt.token_blacklist"
]

MIDDLEWARE = [
    "middleware.prerender_middleware.PrerenderMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware", # 👈 EXCELENTE, ESTO ES NECESARIO
    "corsheaders.middleware.CorsMiddleware",  

    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = 'server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'server.wsgi.application'

# ----------------------------
# Database (ARREGLADO)
# ----------------------------
# Configuración por defecto (Localhost / Fallback)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'escomunidad',
        "USER": "root",
        "PASSWORD": "root",
        "HOST": "localhost",
        "PORT": "3306",
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

# Configuración para RENDER (Usando la URL de Aiven)
# 👇 Aquí Django busca la variable que pusiste en Render
database_url = os.environ.get("DATABASE_URL") 

if database_url:
    DATABASES['default'] = dj_database_url.parse(
        database_url,
        conn_max_age=600,
        conn_health_checks=True,
    )
    DATABASES['default']['ENGINE'] = 'django.db.backends.mysql'
    DATABASES['default']['OPTIONS'] = {'charset': 'utf8mb4'}

# ----------------------------
# Password validation
# ----------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ----------------------------
# Internationalization
# ----------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ----------------------------
# Static files (ARREGLADO)
# ----------------------------
STATIC_URL = 'static/'
# 👇 ESTO FALTABA Y ES OBLIGATORIO PARA RENDER/WHITENOISE
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ----------------------------
# CORS
# ----------------------------
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrtoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# ----------------------------
# REST FRAMEWORK
# ----------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

PRERENDER_URL = "https://service.prerender.io/"
PRERENDER_TOKEN = "IS7CiIA2Ja8NzxKv8Fa2" 

# EMAIL CONFIGURATION
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.sendgrid.net"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "apikey" 
EMAIL_HOST_PASSWORD = "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"
DEFAULT_FROM_EMAIL = "escomunidad.b084@gmail.com"