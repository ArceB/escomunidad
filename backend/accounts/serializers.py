from rest_framework import serializers
from .models import (
    User, Entidad, Anuncio, Notificacion,
    AprobacionResponsable, AprobacionAdministrador,
    GestionEntidad, ResponsableEntidad
)

# Usuario público (sin campos sensibles)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "entidad"]


class EntidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entidad
        fields = ["id", "nombre", "contacto", "correo"]


class AnuncioSerializer(serializers.ModelSerializer):
    usuario = UserSerializer(read_only=True)
    usuario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="usuario", write_only=True, required=False
    )
    entidad = EntidadSerializer(read_only=True)
    entidad_id = serializers.PrimaryKeyRelatedField(
        queryset=Entidad.objects.all(), source="entidad", write_only=True
    )

    class Meta:
        model = Anuncio
        fields = [
            "id", "titulo", "descripcion", "fecha_publicacion",
            "fecha_inicio", "fecha_fin", "banner",
            "usuario", "usuario_id", "entidad", "entidad_id",
        ]
        read_only_fields = ["fecha_publicacion"]


class NotificacionSerializer(serializers.ModelSerializer):
    destinatario = UserSerializer(read_only=True)
    destinatario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="destinatario", write_only=True
    )

    class Meta:
        model = Notificacion
        fields = ["id", "mensaje", "fecha", "visto", "destinatario", "destinatario_id"]
        read_only_fields = ["fecha"]


class AprobacionResponsableSerializer(serializers.ModelSerializer):
    anuncio_id = serializers.PrimaryKeyRelatedField(
        queryset=Anuncio.objects.all(), source="anuncio", write_only=True
    )
    responsable = UserSerializer(read_only=True)
    responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="responsable", write_only=True
    )

    class Meta:
        model = AprobacionResponsable
        fields = ["id", "anuncio", "anuncio_id", "responsable", "responsable_id",
                  "comentarios_rechazo", "aprobado"]


class AprobacionAdministradorSerializer(serializers.ModelSerializer):
    anuncio_id = serializers.PrimaryKeyRelatedField(
        queryset=Anuncio.objects.all(), source="anuncio", write_only=True
    )
    administrador = UserSerializer(read_only=True)
    administrador_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="administrador", write_only=True
    )

    class Meta:
        model = AprobacionAdministrador
        fields = ["id", "anuncio", "anuncio_id", "administrador", "administrador_id",
                  "fecha_revision", "comentarios_rechazo", "aprobado"]
        read_only_fields = ["fecha_revision"]


class GestionEntidadSerializer(serializers.ModelSerializer):
    entidad_id = serializers.PrimaryKeyRelatedField(
        queryset=Entidad.objects.all(), source="entidad", write_only=True
    )
    administrador = UserSerializer(read_only=True)
    administrador_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="administrador", write_only=True
    )

    class Meta:
        model = GestionEntidad
        fields = ["id", "entidad", "entidad_id", "administrador", "administrador_id"]


class ResponsableEntidadSerializer(serializers.ModelSerializer):
    entidad_id = serializers.PrimaryKeyRelatedField(
        queryset=Entidad.objects.all(), source="entidad", write_only=True
    )
    responsable = UserSerializer(read_only=True)
    responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="responsable", write_only=True
    )

    class Meta:
        model = ResponsableEntidad
        fields = ["id", "entidad", "entidad_id", "responsable", "responsable_id"]
