"""
URL configuration for server project.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),              # admin de Django
    path("api/", include("accounts.urls")),       # tus endpoints de accounts
    path("chatbot/", include("chatbot.urls")),    # 👈 tu chatbot en /chatbot/ask/
]
