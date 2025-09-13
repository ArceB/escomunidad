from django.contrib.auth.models import AbstractUser
from django.db import models


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
    contacto = models.CharField(max_length=100)
    correo = models.EmailField()

    def __str__(self):
        return self.nombre


# ======================================================
# Anuncio 
# ======================================================
class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_publicacion = models.DateField(auto_now_add=True)
    fecha_inicio = models.DateField(null=True, blank=True)
    fecha_fin = models.DateField(null=True, blank=True)
    banner = models.CharField(max_length=100, blank=True, null=True)  # ruta del archivo

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="anuncios")
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name="anuncios")

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
