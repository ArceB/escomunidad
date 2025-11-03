import os
import re
import unicodedata

from rest_framework import viewsets, mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenViewBase, TokenRefreshView
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from datetime import date

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.units import inch

from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
import html
from django.utils.html import escape

from textwrap import wrap

from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
from django.utils.safestring import mark_safe

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

# Registrar fuente Unicode compatible con acentos y eñes
pdfmetrics.registerFont(TTFont('DejaVuSans', 'C:\\Windows\\Fonts\\arial.ttf'))


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
    
    # Método para actualizar el campo 'is_active'
    @action(detail=True, methods=["patch"])
    def toggle_active(self, request, pk=None):
        try:
            user = self.get_object()  # Gets the user by ID from the URL
            is_active = request.data.get("is_active")  # Gets the new status from the body

            if is_active is None:
                return Response({"detail": "is_active parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

            user.is_active = is_active  # Update the user's is_active status
            user.save()

            return Response({"detail": "User status updated successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EntidadViewSet(viewsets.ModelViewSet):
    serializer_class = EntidadSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'list':  # Para 'list' (GET) permitimos acceso público
            return [AllowAny()]
        
        user = self.request.user
        if user.is_authenticated:
            if user.role == "superadmin":
                return [IsAuthenticated()]  # full acceso
            if user.role == "admin":
                return [IsAdmin()]
            if user.role == "responsable":
                return [IsResponsable()]
            if user.role == "usuario":
                return [ReadOnly()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.is_authenticated:
            if user.role == "superadmin":
                return Entidad.objects.all().order_by("id")
            if user.role == "admin":
                return Entidad.objects.filter(gestores__administrador=user).order_by("id")
            if user.role == "responsable":
                return Entidad.objects.filter(responsable=user).order_by("id")
            if user.role == "usuario":
                return user.entidades_usuario.all().order_by("id")
        else:
            return Entidad.objects.all().order_by("id")
    
    def perform_create(self, serializer):
        user = self.request.user
        data = self.request.data 

        print("📩 Datos recibidos:", data)

        admin_id = data.get("administrador_input") or data.get("administrador_id")

        entidad = serializer.save()

        if user.role == "superadmin":            
            if admin_id:
                try:
                    administrador = User.objects.get(id=admin_id)
                    if not GestionEntidad.objects.filter(entidad=entidad, administrador=administrador).exists():
                        GestionEntidad.objects.create(entidad=entidad, administrador=administrador)
                except User.DoesNotExist:
                    raise serializers.ValidationError({"administrador_id": "El administrador no existe"})
            else:
                raise serializers.ValidationError({"administrador_id": "Debe seleccionar un administrador"})
                
        elif user.role == "admin":
            if not GestionEntidad.objects.filter(entidad=entidad, administrador=user).exists():
                GestionEntidad.objects.create(entidad=entidad, administrador=user)
        else:
            raise PermissionDenied("No tienes permiso para crear una entidad")
        
        
        
        # ✅ Generar PDF automáticamente
        pdf_path = f"media/entidades/informacion/ficha_entidad_{entidad.id}.pdf"
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)

        c = canvas.Canvas(pdf_path, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)        
        c.drawString(100, 750, f"Información de: {entidad.nombre}")
        c.setFont("Helvetica", 12)
        c.drawString(100, 700, f"Correo: {entidad.correo or 'N/A'}")
        c.drawString(100, 680, f"Teléfono: {entidad.telefono or 'N/A'}")

        c.showPage()
        c.save()

        print(f"✅ PDF generado en: {pdf_path}")


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
            return [IsAuthenticated()]  # solo lectura
        return [ReadOnly()]

    def get_queryset(self):
        user = self.request.user
        entidad_id = self.request.GET.get("entidad_id")
        anuncio_id = self.kwargs.get('anuncio_id')
        estado = self.request.GET.get("estado")  # El estado puede ser 'pendiente' o 'aprobado'

        # Comenzamos con la queryset general
        qs = Anuncio.objects.all()

        # Si el usuario no está autenticado, solo mostramos los anuncios públicos aprobados
        if not user.is_authenticated:
            qs = qs.filter(estado="aprobado").exclude(banner__isnull=True).exclude(banner="")
            if entidad_id:
                qs = qs.filter(entidad_id=entidad_id)
            return qs

        # Filtrado según el rol del usuario
        if user.role == "superadmin":
            # El superadmin ve todos los anuncios
            pass  # No es necesario cambiar nada aquí porque 'qs' ya contiene todos los anuncios

        elif user.role == "admin":
            # El admin ve los anuncios asociados a las entidades que gestiona
            qs = qs.filter(entidad__gestores__administrador=user)

        elif user.role == "usuario":
            # El usuario ve los anuncios aprobados de las entidades a las que pertenece
            qs = qs.filter(entidad__in=user.entidades_usuario.all(), estado="aprobado")

        elif user.role == "responsable":
            # El responsable ve los anuncios de las entidades que gestiona
            qs = qs.filter(entidad__responsable=user)
        
            # Si el estado es 'pendiente', lo filtramos por estado
            if estado:
                qs = qs.filter(estado=estado)
            else:
                # Si no se especifica estado, mostramos solo los aprobados
                qs = qs.filter(estado="pendiente")

        else:
            # Si no se cumple ninguno de los roles anteriores, no mostramos anuncios
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
            anuncio = serializer.save(usuario=user, entidad=entidad, estado="aprobado")

        elif user.role == "admin":
            if Entidad.objects.filter(id=entidad_id, gestores__administrador=user).exists():
                anuncio = serializer.save(usuario=user, entidad=entidad, estado="aprobado")
            else:
                raise serializers.ValidationError({"detail": "No puedes crear anuncios en esta entidad"})

        elif user.role == "usuario":
            if Entidad.objects.filter(id=entidad_id, usuarios=user).exists():
                anuncio = serializer.save(usuario=user, entidad=entidad, estado="pendiente")
            else:
                raise serializers.ValidationError({"detail": "No perteneces a esta entidad"})

        else:
            raise serializers.ValidationError({"detail": "No tienes permiso para crear anuncios"})
        
        if anuncio.estado == "aprobado":
            self.generar_pdf_anuncio(anuncio)

    def sanitize_html_for_pdf(self, html_text):
        """
        Limpia y normaliza HTML para ser seguro con ReportLab.
        - Elimina atributos (style, class, etc.)
        - Permite solo etiquetas básicas
        - Asegura que las etiquetas estén balanceadas
        - Normaliza acentos y caracteres especiales
        """
        if not html_text:
            return ""

        # 1️⃣ Decodificar entidades HTML (&aacute;, &ntilde;, etc.)
        html_text = html.unescape(html_text)

        # 2️⃣     Normalizar codificación (acentos, tildes, etc.)
        html_text = unicodedata.normalize("NFKC", html_text)

        # 3️⃣ Quitar atributos dentro de etiquetas (<b style="..."> -> <b>)
        html_text = re.sub(r'<(\w+)(\s+[^>]*)>', r'<\1>', html_text)

        # 4️⃣ Dejar solo etiquetas permitidas
        allowed_tags = ['b', 'i', 'u', 'br', 'strong', 'em']
        html_text = re.sub(
            r'</?(?!(' + '|'.join(allowed_tags) + r')\b)[^>]*>',
            '',
            html_text
        )

        # 5️⃣ Normalizar etiquetas equivalentes
        html_text = html_text.replace('<strong>', '<b>').replace('</strong>', '</b>')
        html_text = html_text.replace('<em>', '<i>').replace('</em>', '</i>')

        # 6️⃣ Asegurar que todas las etiquetas estén cerradas
        for tag in ['b', 'i', 'u']:
            open_count = len(re.findall(f'<{tag}>', html_text))
            close_count = len(re.findall(f'</{tag}>', html_text))
            if open_count > close_count:
                html_text += f'</{tag}>' * (open_count - close_count)

        # 7️⃣ Reemplazar saltos de línea y espacios
        html_text = html_text.replace('\n', '<br/>').replace('&nbsp;', ' ')

        # 8️⃣ Quitar caracteres no imprimibles
        html_text = ''.join(ch for ch in html_text if ch.isprintable() or ch in '\n\r\t')

        return html_text.strip()
    
    def perform_update(self, serializer):
        anuncio = serializer.save()

        # 🧠 Si el anuncio está aprobado, regenerar PDF informativo
        if anuncio.estado == "aprobado":
            self.generar_pdf_anuncio(anuncio)

    def generar_pdf_anuncio(self, anuncio):
        import unicodedata, html, re
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_JUSTIFY
        from reportlab.lib.units import inch
        import os

        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_dir = os.path.join(BASE_DIR, "chatbot", "documents")
        os.makedirs(pdf_dir, exist_ok=True)

        pdf_path = os.path.join(pdf_dir, f"info_anuncio_{anuncio.id}.pdf")

        # 🧹 Eliminar versión anterior si existe
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

        # Generar el nuevo PDF
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name="Justify", alignment=TA_JUSTIFY, leading=16))
        content = []

        content.append(Paragraph(f"<b>Información de</b> {anuncio.titulo}", styles["Heading2"]))
        content.append(Spacer(1, 12))
        if anuncio.frase:
            content.append(Paragraph(f"<b>Frase:</b> {anuncio.frase}", styles["Normal"]))
        content.append(Spacer(1, 10))

        clean_desc = self.sanitize_html_for_pdf(anuncio.descripcion or "---")
        content.append(Paragraph("<b>Descripción:</b>", styles["Normal"]))

        try:
            content.append(Paragraph(clean_desc, styles["Justify"]))
        except Exception:
            import re
            safe_text = re.sub(r"<[^>]+>", "", clean_desc)
            content.append(Paragraph(safe_text, styles["Justify"]))

        content.append(Spacer(1, 12))
        content.append(Paragraph(f"<b>Entidad:</b> {anuncio.entidad.nombre}", styles["Normal"]))
        content.append(Paragraph(f"<b>Fecha inicio:</b> {anuncio.fecha_inicio or '---'}", styles["Normal"]))
        content.append(Paragraph(f"<b>Fecha fin:</b> {anuncio.fecha_fin or '---'}", styles["Normal"]))

        doc.build(content)

        print(f"✅ PDF informativo actualizado: {pdf_path}")

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def public(self, request):
        """Endpoint público para mostrar banners"""
        entidad_id = request.query_params.get("entidad_id")
        qs = Anuncio.objects.exclude(banner="").exclude(banner=None)
        if entidad_id:
            qs = qs.filter(entidad_id=entidad_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def revisar(self, request, pk=None):
        """Permite a los responsables aprobar o rechazar anuncios"""
        user = request.user
        anuncio = self.get_object()

        if anuncio.estado != "pendiente":
            return Response({"detail": "Este anuncio no está pendiente de revisión."}, status=status.HTTP_400_BAD_REQUEST)

        if user.role != "responsable":
            raise PermissionDenied("Solo los responsables pueden revisar anuncios")

        if anuncio.entidad.responsable != user:
            raise PermissionDenied("No puedes revisar anuncios de otras entidades")

        accion = request.data.get("accion")
        if accion not in ["aprobar", "rechazar"]:
            return Response({"detail": "Acción inválida"}, status=400)

        if accion == "aprobar":
            anuncio.estado = "aprobado"
            anuncio.save(update_fields=["estado"])
            self.generar_pdf_anuncio(anuncio)
        else:
            anuncio.estado = "rechazado"
            anuncio.save(update_fields=["estado"])

        return Response({"ok": True, "nuevo_estado": anuncio.estado})
    
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def todos(self, request):
        """Devuelve todos los anuncios aprobados, sin importar la entidad."""
        anuncios = Anuncio.objects.filter(estado="aprobado").exclude(banner__isnull=True)
        serializer = self.get_serializer(anuncios, many=True)
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
        user = serializer.save(is_active=False)

        # Crear token temporal
        token = PasswordResetToken.objects.create(user=user)

        # Enviar correo
        FRONTEND_URL = "http://localhost:5173"  # ajusta según tu setup
        link = f"{FRONTEND_URL}/crear-contraseña/{token.token}/"

        send_mail(
            subject="Asignación de contraseña",
            message=(
                f"Hola {user.first_name},\n\n"
                f"Se ha creado tu cuenta en el sistema. Para asignar tu contraseña, accede al siguiente enlace: {link}\n\n"
                f"Tu nombre de usuario es: {user.username}\n\n"
                f"Saludos,\nEl equipo de soporte"
            ),
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
            user.is_active = True 
            user.save()

            reset_token.used = True
            reset_token.save()

            return Response({"success": True})
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Token inválido"}, status=400)

class ResendTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):  # El 'user_id' debe venir de la URL
        try:
            # Buscar al usuario desactivado
            user = User.objects.get(id=user_id, is_active=False)

            # Crear un nuevo token de restablecimiento de contraseña
            reset_token = PasswordResetToken.objects.create(user=user)

            # Crear el enlace de restablecimiento
            FRONTEND_URL = "http://localhost:5173"  # Ajusta la URL según tu configuración
            link = f"{FRONTEND_URL}/crear-contraseña/{reset_token.token}/"

            # Enviar el correo con el enlace de restablecimiento
            send_mail(
                subject="Asignación de contraseña",
                message=(
                    f"Hola {user.first_name},\n\n"
                    f"Se ha creado tu cuenta en el sistema. Para asignar tu contraseña, accede al siguiente enlace: {link}\n\n"
                    f"Tu nombre de usuario es: {user.username}\n\n"
                    f"Saludos,\nEl equipo de soporte"
                ),
                from_email="no-reply@tusitio.com",
                recipient_list=[user.email],
            )

            return Response({"success": "Token reenviado"}, status=200)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado o ya está activo"}, status=404)