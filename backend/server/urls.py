"""
URL configuration for server project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),              # admin de Django
    path("api/", include("accounts.urls")),       # tus endpoints de accounts
    path("chatbot/", include("chatbot.urls")),    # 👈 tu chatbot en /chatbot/ask/
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
