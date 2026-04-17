"""
Django settings for core project.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# قراءة المتغيرات الحساسة من ملف .env
# ============================================================
def _get_env(key, default=None):
    """قراءة بسيطة من ملف .env بجانب هذا الملف."""
    env_path = BASE_DIR / '.env'
    if env_path.exists():
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, _, v = line.partition('=')
                    if k.strip() == key:
                        return v.strip()
    return os.environ.get(key, default)


SECRET_KEY = _get_env('SECRET_KEY', 'fallback-insecure-key-change-me')

DEBUG = _get_env('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = _get_env('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')


# ============================================================
# التطبيقات المثبتة
# ============================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'inventory',
    'customers',
    'accounts',
    'ai_assistant',
    'system_settings',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ============================================================
# CORS — في الإنتاج استبدل بـ CORS_ALLOWED_ORIGINS مع القائمة الصريحة
# ============================================================
CORS_ALLOW_ALL_ORIGINS = DEBUG  # مفتوح فقط في وضع التطوير

# ============================================================
# Django REST Framework
# ============================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
        'accounts.permissions.RoleBasedPermission',
    ],
}

ROOT_URLCONF = 'core.urls'

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

WSGI_APPLICATION = 'core.wsgi.application'

# ============================================================
# قاعدة البيانات — PostgreSQL
# ============================================================
DATABASES = {
    'default': {
        'ENGINE': _get_env('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': _get_env('DB_NAME', 'erp_db'),
        'USER': _get_env('DB_USER', 'admin'),
        'PASSWORD': _get_env('DB_PASSWORD', 'adminpass'),
        'HOST': _get_env('DB_HOST', '127.0.0.1'),
        'PORT': _get_env('DB_PORT', '5432'),
    }
}

# ============================================================
# التحقق من كلمات المرور
# ============================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================
# الدولية والوقت
# ============================================================
LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Africa/Cairo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

# ============================================================
# Media Files (Images, Uploads)
# ============================================================
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
