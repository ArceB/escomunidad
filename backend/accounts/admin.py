from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    Entidad,
    Anuncio,
    Notificacion,
    AprobacionResponsable,
    AprobacionAdministrador,
    GestionEntidad,
    ResponsableEntidad,
)


# ======================================================
# User personalizado con roles
# ======================================================
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("id", "username", "email", "role", "is_active", "is_staff", "is_superuser")
    list_filter = ("role", "is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email")
    ordering = ("id",)

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Rol y Entidad", {"fields": ("role", "entidad")}),
    )


# ======================================================
# Entidad
# ======================================================
@admin.register(Entidad)
class EntidadAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "correo", "telefono")
    search_fields = ("nombre", "correo", "telefono")


# ======================================================
# Anuncio
# ======================================================
@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "usuario", "entidad", "created_at", "fecha_inicio", "fecha_fin")
    list_filter = ("entidad", "created_at")
    search_fields = ("titulo", "descripcion")
    date_hierarchy = "created_at"
    
# ======================================================
# Notificaciones
# ======================================================
@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ("id", "mensaje", "destinatario", "fecha", "visto")
    list_filter = ("visto", "fecha")
    search_fields = ("mensaje",)


# ======================================================
# Aprobaciones
# ======================================================
@admin.register(AprobacionResponsable)
class AprobacionResponsableAdmin(admin.ModelAdmin):
    list_display = ("id", "anuncio", "responsable", "aprobado")
    list_filter = ("aprobado",)
    search_fields = ("anuncio__titulo", "responsable__username")


@admin.register(AprobacionAdministrador)
class AprobacionAdministradorAdmin(admin.ModelAdmin):
    list_display = ("id", "anuncio", "administrador", "aprobado", "fecha_revision")
    list_filter = ("aprobado", "fecha_revision")
    search_fields = ("anuncio__titulo", "administrador__username")
    date_hierarchy = "fecha_revision"


# ======================================================
# Relaciones de gestión
# ======================================================
@admin.register(GestionEntidad)
class GestionEntidadAdmin(admin.ModelAdmin):
    list_display = ("id", "administrador", "entidad")
    list_filter = ("entidad",)
    search_fields = ("administrador__username", "entidad__nombre")


@admin.register(ResponsableEntidad)
class ResponsableEntidadAdmin(admin.ModelAdmin):
    list_display = ("id", "responsable", "entidad")
    list_filter = ("entidad",)
    search_fields = ("responsable__username", "entidad__nombre")
