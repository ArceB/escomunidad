from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenViewBase, TokenRefreshView

from .tokens import RoleTokenObtainPairSerializer
from .permissions import IsAdmin, IsSuperAdmin, IsResponsable, ReadOnly
from .models import (
    User, Entidad, Anuncio, Notificacion,
    AprobacionResponsable, AprobacionAdministrador,
    GestionEntidad, ResponsableEntidad
)
from .serializers import (
    UserSerializer, EntidadSerializer, AnuncioSerializer, NotificacionSerializer,
    AprobacionResponsableSerializer, AprobacionAdministradorSerializer,
    GestionEntidadSerializer, ResponsableEntidadSerializer
)


# ---------- AUTH ----------
class TokenObtainPairView(TokenViewBase):
    serializer_class = RoleTokenObtainPairSerializer
    permission_classes = [AllowAny]


class TokenRefresh(TokenRefreshView):
    permission_classes = [AllowAny]


# ---------- UTIL ----------
class MeViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        # GET /api/me/
        return Response(UserSerializer(request.user).data)


# ---------- CRUD ----------
class UserViewSet(mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  viewsets.GenericViewSet):
    """
    Solo lectura de usuarios para admins/superadmins (de ejemplo).
    """
    queryset = User.objects.select_related("entidad").order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin | IsSuperAdmin]


class EntidadViewSet(viewsets.ModelViewSet):
    queryset = Entidad.objects.all().order_by("id")
    serializer_class = EntidadSerializer
    permission_classes = [IsAuthenticated, IsAdmin | IsSuperAdmin | ReadOnly]


class AnuncioViewSet(viewsets.ModelViewSet):
    queryset = Anuncio.objects.select_related("usuario", "entidad").order_by("-id")
    serializer_class = AnuncioSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Asignar el usuario autenticado como creador por defecto
        serializer.save(usuario=self.request.user)


class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.select_related("destinatario").order_by("-id")
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    # /api/notificaciones/marcar_vista/
    @action(detail=False, methods=["post"])
    def marcar_vista(self, request):
        ids = request.data.get("ids", [])
        Notificacion.objects.filter(id__in=ids, destinatario=request.user).update(visto=True)
        return Response({"ok": True})


class AprobacionResponsableViewSet(viewsets.ModelViewSet):
    queryset = AprobacionResponsable.objects.select_related("anuncio", "responsable").order_by("-id")
    serializer_class = AprobacionResponsableSerializer
    permission_classes = [IsAuthenticated, IsResponsable | IsAdmin | IsSuperAdmin]


class AprobacionAdministradorViewSet(viewsets.ModelViewSet):
    queryset = AprobacionAdministrador.objects.select_related("anuncio", "administrador").order_by("-id")
    serializer_class = AprobacionAdministradorSerializer
    permission_classes = [IsAuthenticated, IsAdmin | IsSuperAdmin]


class GestionEntidadViewSet(viewsets.ModelViewSet):
    queryset = GestionEntidad.objects.select_related("entidad", "administrador").order_by("id")
    serializer_class = GestionEntidadSerializer
    permission_classes = [IsAuthenticated, IsAdmin | IsSuperAdmin]


class ResponsableEntidadViewSet(viewsets.ModelViewSet):
    queryset = ResponsableEntidad.objects.select_related("entidad", "responsable").order_by("id")
    serializer_class = ResponsableEntidadSerializer
    permission_classes = [IsAuthenticated, IsAdmin | IsSuperAdmin]
