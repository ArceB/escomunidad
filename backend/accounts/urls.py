from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogoutView

from .views import (
    TokenObtainPairView, TokenRefresh, MeViewSet,
    UserViewSet, EntidadViewSet, AnuncioViewSet, NotificacionViewSet,
    AprobacionResponsableViewSet, AprobacionAdministradorViewSet,
    GestionEntidadViewSet, ResponsableEntidadViewSet, VerifyResetToken, ResetPassword, UsuarioViewSet, ResendTokenView, ForgotPasswordView
)

router = DefaultRouter()
router.register(r"me", MeViewSet, basename="me")
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r"users", UserViewSet, basename="users")
router.register(r"entidades", EntidadViewSet, basename="entidades")
router.register(r"anuncios", AnuncioViewSet, basename="anuncios")
router.register(r"notificaciones", NotificacionViewSet, basename="notificaciones")
router.register(r"aprobaciones-responsable", AprobacionResponsableViewSet, basename="aprob-resp")
router.register(r"aprobaciones-admin", AprobacionAdministradorViewSet, basename="aprob-admin")
router.register(r"gestion-entidad", GestionEntidadViewSet, basename="gestion-entidad")
router.register(r"responsable-entidad", ResponsableEntidadViewSet, basename="responsable-entidad")

urlpatterns = [
    path("", include(router.urls)),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefresh.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    
    path("auth/verify-reset-token/", VerifyResetToken.as_view()),
    path("auth/reset-password/", ResetPassword.as_view()),
    path("auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),


    path('usuarios/<int:user_id>/resend_token/', ResendTokenView.as_view(), name='resend_token'),
    
    path('api/', include(router.urls)),
]
