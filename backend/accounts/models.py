import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model


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
    correo = models.EmailField()
    telefono = models.CharField(max_length=20, blank=True, null=True)
    foto_portada = models.ImageField(upload_to="entidades/", default="entidades/default.webp", blank=True, null=True)

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

    def __str__(self):
        return self.nombre
    
    def delete(self, *args, **kwargs):
        # 1. Borra la foto de portada DE LA ENTIDAD
        if self.foto_portada:
            self.foto_portada.delete(save=False) # 👈 AÑADIMOS ESTA LÍNEA

        # 2. Borra todos los archivos de los anuncios hijos
        for anuncio in self.anuncios.all():
            anuncio.delete() # Esto ejecuta el .delete() del Anuncio

        # 3. Borra la Entidad de la base de datos
        super().delete(*args, **kwargs)

# ======================================================
# Anuncio 
# ======================================================
class Anuncio(models.Model):
    entidad = models.ForeignKey("Entidad", on_delete=models.CASCADE, related_name="anuncios")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=255)
    frase = models.CharField(max_length=255, blank=True, null=True)
    descripcion = models.TextField()
    banner = models.ImageField(upload_to="anuncios/banners/", blank=True, null=True)
    archivo_pdf = models.FileField(upload_to="anuncios/pdfs/", blank=True, null=True)
    fecha_inicio = models.DateField(blank=True, null=True)
    fecha_fin = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo
    
    def delete(self, *args, **kwargs):
        # 1. Borra el archivo banner del storage (media/anuncios/banners/)
        if self.banner:
            self.banner.delete(save=False)

        # 2. Borra el archivo PDF del storage (media/anuncios/pdfs/)
        if self.archivo_pdf:
            self.archivo_pdf.delete(save=False)

        # 3. Llama al método delete() original para borrar el anuncio de la BD
        super().delete(*args, **kwargs)



# ======================================================
# Notificaciones
# ======================================================
class Notificacion(models.Model):
    mensaje = models.TextField()
    fecha = models.DateField(auto_now_add=True)
    visto = models.BooleanField(default=False)

    destinatario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notificaciones")

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
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expires_at)
    used = models.BooleanField(default=False)

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at
