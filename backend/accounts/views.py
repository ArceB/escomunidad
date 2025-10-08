from rest_framework import viewsets, mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenViewBase, TokenRefreshView
from rest_framework.exceptions import PermissionDenied
from datetime import date
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from django.core.mail import send_mail

from .models import Anuncio, Entidad
from .serializers import AnuncioSerializer

from .tokens import RoleTokenObtainPairSerializer
from .permissions import IsAdmin, IsSuperAdmin, IsResponsable, ReadOnly
from .models import (
    User, Entidad, Anuncio, Notificacion,
    AprobacionResponsable, AprobacionAdministrador,
    GestionEntidad, ResponsableEntidad, PasswordResetToken
)
from .serializers import (
    UserSerializer, EntidadSerializer, AnuncioSerializer, NotificacionSerializer,
    AprobacionResponsableSerializer, AprobacionAdministradorSerializer,
    GestionEntidadSerializer, ResponsableEntidadSerializer, CrearUsuarioSerializer, ResetPasswordSerializer
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
    queryset = User.objects.select_related("entidad").order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class EntidadViewSet(viewsets.ModelViewSet):
    serializer_class = EntidadSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # Lectura pública: list y retrieve
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        # Creación/edición/borrado sigue restringida
        user = self.request.user
        if not user.is_authenticated:
            return [ReadOnly()]
        if user.role == "superadmin":
            return [IsAuthenticated()]  # full acceso
        if user.role == "admin":
            return [IsAdmin()]
        if user.role == "responsable":
            return [IsResponsable()]
        if user.role == "usuario":
            return [ReadOnly()]
        return [ReadOnly()]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Entidad.objects.all().order_by("id")

        if user.role == "superadmin":
            return Entidad.objects.all().order_by("id")
        if user.role == "admin":
            return Entidad.objects.filter(gestores__administrador=user).order_by("id")
        if user.role == "responsable":
            return Entidad.objects.filter(responsable=user).order_by("id")
        if user.role == "usuario":
            return user.entidades_usuario.all().order_by("id")

        return Entidad.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ["admin", "superadmin"]:
            raise PermissionDenied("No tienes permiso para crear entidades.")
        serializer.save()

class AnuncioViewSet(viewsets.ModelViewSet):
    serializer_class = AnuncioSerializer
    queryset = Anuncio.objects.all()

    def get_permissions(self):
        # 👇 si es la acción "public", no pedimos autenticación
        if self.action == "public":
            return [AllowAny()]

        user = self.request.user
        if not user.is_authenticated:
            return [ReadOnly()]  # usuarios anónimos => solo lectura

        if user.role == "superadmin":
            return [IsAuthenticated()]
        if user.role == "admin":
            return [IsAdmin()]
        if user.role == "usuario":
            return [IsAuthenticated()]  # puede crear
        if user.role == "responsable":
            return [ReadOnly()]  # solo lectura
        return [ReadOnly()]

    def get_queryset(self):
        user = self.request.user
        entidad_id = self.request.GET.get("entidad_id")
        anuncio_id = self.kwargs.get('anuncio_id')

        print(f"Filtrando anuncios por entidad_id: {entidad_id}, anuncio_id: {anuncio_id}")

        # Si no hay usuario autenticado, solo mostramos anuncios públicos
        if not user.is_authenticated:
            qs = Anuncio.objects.exclude(banner="").exclude(banner=None)
            if entidad_id:
                qs = qs.filter(entidad_id=entidad_id)
            return qs

        # Filtrado según el rol del usuario
        if user.role == "superadmin":
            qs = Anuncio.objects.all()
        elif user.role == "admin":
            qs = Anuncio.objects.filter(entidad__gestores__administrador=user)
        elif user.role == "usuario":
            qs = Anuncio.objects.filter(entidad__in=user.entidades_usuario.all())
        elif user.role == "responsable":
            qs = Anuncio.objects.filter(entidad__responsable=user)
        else:
            qs = Anuncio.objects.none()

        # Filtrar por entidad_id si está presente
        if entidad_id:
            qs = qs.filter(entidad_id=entidad_id)

        # Si tenemos un anuncio_id (detalles de un anuncio), filtramos por ese ID
        if anuncio_id:
            qs = qs.filter(id=anuncio_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        entidad_id = self.request.data.get("entidad")

        if not entidad_id:
            raise serializers.ValidationError({"entidad": "El id de la entidad es requerido"})

        try:
            entidad = Entidad.objects.get(pk=entidad_id)
        except Entidad.DoesNotExist:
            raise serializers.ValidationError({"entidad": f"No existe una entidad con id {entidad_id}"})

        if user.role == "superadmin":
            serializer.save(usuario=user, entidad=entidad)

        elif user.role == "admin":
            if Entidad.objects.filter(id=entidad_id, gestores__administrador=user).exists():
                serializer.save(usuario=user, entidad=entidad)
            else:
                raise serializers.ValidationError({"detail": "No puedes crear anuncios en esta entidad"})

        elif user.role == "usuario":
            if Entidad.objects.filter(id=entidad_id, usuarios=user).exists():
                serializer.save(usuario=user, entidad=entidad)
            else:
                raise serializers.ValidationError({"detail": "No perteneces a esta entidad"})

        else:
            raise serializers.ValidationError({"detail": "No tienes permiso para crear anuncios"})

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def public(self, request):
        """Endpoint público para mostrar banners"""
        entidad_id = request.query_params.get("entidad_id")
        qs = Anuncio.objects.exclude(banner="").exclude(banner=None)
        if entidad_id:
            qs = qs.filter(entidad_id=entidad_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)



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

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Invalidar refresh token si se envía
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            # Limpiar sesión (si usas session auth)
            request.session.flush()
            return Response({"detail": "Logout exitoso"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = CrearUsuarioSerializer
    queryset = User.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Crear token temporal
        token = PasswordResetToken.objects.create(user=user)

        # Enviar correo
        FRONTEND_URL = "http://localhost:5173"  # ajusta según tu setup
        link = f"{FRONTEND_URL}/crear-contraseña/{token.token}/"

        send_mail(
            subject="Asignación de contraseña",
            message=f"Hola {user.first_name}, accede al siguiente enlace para asignar tu contraseña: {link}",
            from_email="no-reply@tusitio.com",
            recipient_list=[user.email],
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class VerifyResetToken(APIView):
    def get(self, request):
        token = request.query_params.get("token")
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_valid():
                return Response({"valid": True})
            return Response({"valid": False}, status=400)
        except PasswordResetToken.DoesNotExist:
            return Response({"valid": False}, status=400)
        
class ResetPassword(APIView):
    def get(self, request, token):
        # Retornar algo tipo "Ingrese su nueva contraseña"
        # Esto puede ser un template o un JSON con valid=True
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_valid():
                return Response({"valid": True, "token": str(token)})
            return Response({"valid": False}, status=400)
        except PasswordResetToken.DoesNotExist:
            return Response({"valid": False}, status=400)
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if not reset_token.is_valid():
                return Response({"error": "Token inválido o expirado"}, status=400)
            
            user = reset_token.user
            user.set_password(password)
            user.save()

            reset_token.used = True
            reset_token.save()

            return Response({"success": True})
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Token inválido"}, status=400)

