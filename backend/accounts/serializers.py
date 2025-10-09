from rest_framework import serializers
from django.contrib.auth import get_user_model
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
    foto_portada = serializers.ImageField(use_url=True)

    responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="responsable"),
        source="responsable",
        write_only=True,
        required=False,
        allow_null=True
    )
    responsable = UserSerializer(read_only=True)

    usuarios_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="usuario"),
        source="usuarios",
        many=True,
        write_only=True,
        required=False
    )
    usuarios = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Entidad
        fields = [
            "id", "nombre", "correo", "telefono", "foto_portada",
            "responsable", "responsable_id",
            "usuarios", "usuarios_ids",
        ]

    def create(self, validated_data):
        usuarios = validated_data.pop("usuarios", [])
        entidad = Entidad.objects.create(**validated_data)
        if usuarios:
            entidad.usuarios.set(usuarios)
        return entidad

    def update(self, instance, validated_data):
        usuarios = validated_data.pop("usuarios", None)
        instance = super().update(instance, validated_data)
        if usuarios is not None:
            instance.usuarios.set(usuarios)
        return instance


class AnuncioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anuncio
        fields = "__all__"
        read_only_fields = ["usuario"]  # el usuario lo pone perform_create



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

User = get_user_model()

class CrearUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "role"]

    def create(self, validated_data):
        base_username = validated_data["email"].split("@")[0]  # parte antes del @
        username = base_username
        i = 1

        # Asegurar que el username sea único
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{i}"
            i += 1

        # Crear el usuario
        user = User.objects.create(
            username=username,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            email=validated_data["email"],
            role=validated_data["role"],
        )

        return user
    
class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
