import uuid
import os
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.utils.timezone import now

def entidad_cover_upload_to(instance, filename):
    """
    Define el nombre del archivo de portada de la entidad.
    Ejemplo: entidades/cover_entidad_5.png
    """
    ext = filename.split('.')[-1]

    # Si la entidad aún no tiene ID, generamos un nombre temporal
    if instance.id:
        filename = f"cover_entidad_{instance.id}.{ext}"
    else:
        filename = f"cover_entidad_temp_{int(now().timestamp())}.{ext}"

    return os.path.join('entidades', filename)


def anuncio_banner_upload_to(instance, filename):
    """
    Define el nombre del archivo de banner del anuncio.
    Ejemplo: anuncios/banners/banner_anuncio_5.png
    """
    ext = filename.split('.')[-1]
    if instance.id:
        filename = f"banner_anuncio_{instance.id}.{ext}"
    else:
        filename = f"banner_anuncio_temp_{int(now().timestamp())}.{ext}"

    return os.path.join('anuncios/banners', filename)


def anuncio_pdf_upload_to(instance, filename):
    """
    Define el nombre del archivo PDF del anuncio.
    Ejemplo: anuncios/pdfs/anexo_anuncio_5.pdf
    """
    ext = filename.split('.')[-1]
    if instance.id:
        filename = f"anexo_anuncio_{instance.id}.{ext}"
    else:
        filename = f"anexo_anuncio_temp_{int(now().timestamp())}.{ext}"

    return os.path.join('anuncios/pdfs', filename)


# ======================================================
# Usuario central con roles
# ======================================================
class User(AbstractUser):
    ROLE_CHOICES = [
        ("usuario", "Usuario"),
        ("responsable", "Responsable"),
        ("admin", "Administrador"),
        ("superadmin", "Superadministrador"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="usuario")

    entidad = models.ForeignKey("Entidad", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


# ======================================================
# Entidad 
# ======================================================
class Entidad(models.Model):
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(null=True, blank=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    foto_portada = models.ImageField(
        upload_to=entidad_cover_upload_to,
        default="entidades/default.webp",
        blank=True,
        null=True
    )

    responsable = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="entidad_responsable",
        limit_choices_to={"role": "responsable"}
    )
    usuarios = models.ManyToManyField(
        "accounts.User",
        blank=True,
        related_name="entidades_usuario",
        limit_choices_to={"role": "usuario"}
    )

    def save(self, *args, **kwargs):
        """
        Sobrescribe save() para renombrar la foto_portada después de obtener un ID.
        """
        super().save(*args, **kwargs)

        if self.foto_portada and "temp" in self.foto_portada.name:
            old_path = self.foto_portada.path
            ext = old_path.split('.')[-1]
            new_filename = f"cover_entidad_{self.id}.{ext}"
            new_path = os.path.join(os.path.dirname(old_path), new_filename)

            # Renombrar archivo físicamente en el sistema
            os.rename(old_path, new_path)

            # Actualizar la referencia en la base de datos
            self.foto_portada.name = f"entidades/{new_filename}"
            super().save(update_fields=["foto_portada"])

    def __str__(self):
        return self.nombre

# ======================================================
# Anuncio 
# ======================================================
class Anuncio(models.Model):
    entidad = models.ForeignKey("Entidad", on_delete=models.CASCADE, related_name="anuncios")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=255)
    frase = models.CharField(max_length=255, blank=True, null=True)
    descripcion = models.TextField()
    banner = models.ImageField(upload_to=anuncio_banner_upload_to, blank=True, null=True)
    archivo_pdf = models.FileField(upload_to=anuncio_pdf_upload_to, blank=True, null=True)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)

    ESTADO_CHOICES = [
        ("pendiente", "Pendiente de revisión"),
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
    ]

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default="pendiente"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """
        Sobrescribe save() para renombrar banner y PDF después de obtener un ID.
        """
        if self.pk:
            old_instance = Anuncio.objects.filter(pk=self.pk).first()
            if old_instance:
                # Eliminar banner viejo si cambió
                if old_instance.banner and old_instance.banner != self.banner:
                    if os.path.isfile(old_instance.banner.path):
                        os.remove(old_instance.banner.path)
                # Eliminar PDF viejo si cambió
                if old_instance.archivo_pdf and old_instance.archivo_pdf != self.archivo_pdf:
                    if os.path.isfile(old_instance.archivo_pdf.path):
                        os.remove(old_instance.archivo_pdf.path)

        super().save(*args, **kwargs)

        # --- Renombrar banner si tiene nombre temporal ---
        if self.banner and "temp" in self.banner.name:
            old_path = self.banner.path
            ext = old_path.split('.')[-1]
            new_filename = f"banner_anuncio_{self.id}.{ext}"
            new_path = os.path.join(os.path.dirname(old_path), new_filename)

            if os.path.exists(old_path):
                os.rename(old_path, new_path)

            self.banner.name = f"anuncios/banners/{new_filename}"
            super().save(update_fields=["banner"])

        # --- Renombrar archivo PDF si tiene nombre temporal ---
        if self.archivo_pdf and "temp" in self.archivo_pdf.name:
            old_path = self.archivo_pdf.path
            ext = old_path.split('.')[-1]
            new_filename = f"anexo_anuncio_{self.id}.{ext}"
            new_path = os.path.join(os.path.dirname(old_path), new_filename)

            if os.path.exists(old_path):
                os.rename(old_path, new_path)

            self.archivo_pdf.name = f"anuncios/pdfs/{new_filename}"
            super().save(update_fields=["archivo_pdf"])

    def __str__(self):
        return self.titulo



# ======================================================
# Notificaciones
# ======================================================
class Notificacion(models.Model):
    mensaje = models.TextField()
    fecha = models.DateField(auto_now_add=True)
    visto = models.BooleanField(default=False)

    destinatario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notificaciones")
    anuncio = models.ForeignKey('Anuncio', on_delete=models.CASCADE, null=True, blank=True, related_name="notificaciones")
    banner = models.ImageField(upload_to="notificaciones/banners/", null=True, blank=True)

    def __str__(self):
        return f"Notificación para {self.destinatario.username} - {self.mensaje[:30]}"


# ======================================================
# Aprobaciones (por Responsable y por Administrador)
# ======================================================
class AprobacionResponsable(models.Model):
    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name="aprobaciones_responsable")
    responsable = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={"role": "responsable"})
    comentarios_rechazo = models.TextField(blank=True, null=True)
    aprobado = models.BooleanField(default=False)

    def __str__(self):
        return f"Aprobación Responsable de {self.anuncio.titulo}"


class AprobacionAdministrador(models.Model):
    anuncio = models.ForeignKey(Anuncio, on_delete=models.CASCADE, related_name="aprobaciones_admin")
    administrador = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={"role": "admin"})
    fecha_revision = models.DateField(auto_now_add=True)
    comentarios_rechazo = models.TextField(blank=True, null=True)
    aprobado = models.BooleanField(default=False)

    def __str__(self):
        return f"Aprobación Admin de {self.anuncio.titulo}"


# ======================================================
# Relaciones de gestión 
# ======================================================
class GestionEntidad(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name="gestores")
    administrador = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={"role": "admin"})

    def __str__(self):
        return f"{self.administrador.username} gestiona {self.entidad.nombre}"


class ResponsableEntidad(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name="responsables")
    responsable = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={"role": "responsable"})

    def __str__(self):
        return f"{self.responsable.username} responsable en {self.entidad.nombre}"
    
def default_expires_at():
    return timezone.now() + timedelta(days=1)

class PasswordResetToken(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=timezone.now() + timedelta(days=1))
    used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at

    def __str__(self):
        return f"Token for {self.user.email} - {'Used' if self.used else 'Active'}"
