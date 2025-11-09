"""
URL configuration for server project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from accounts.views import LogoutView
from accounts.views import ResetPassword, VerifyResetToken


urlpatterns = [
    path("admin/", admin.site.urls),              # admin de Django
    path("api/", include("accounts.urls")),       # tus endpoints de accounts
    path("chatbot/", include("chatbot.urls")), 
    path("crear-contraseña/<uuid:token>/", ResetPassword.as_view(), name="crear-contraseña"),   
    path("auth/reset-password/", ResetPassword.as_view(), name="reset-password"),
    path("auth/verify-reset-token/", VerifyResetToken.as_view(), name="verify-reset-token"),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
