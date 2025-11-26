from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    User, Entidad, Anuncio, Notificacion,
    AprobacionResponsable, AprobacionAdministrador,
    GestionEntidad, ResponsableEntidad
)

# Usuario público (sin campos sensibles)
class UserSerializer(serializers.ModelSerializer):
    entidades = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "entidad", "entidades", "first_name", "last_name", "is_active"]

    def get_entidades(self, obj):
        # entidades donde es usuario
        entidades_usuario = obj.entidades_usuario.all().values_list("nombre", flat=True)
        # entidades donde es responsable
        entidades_responsable = obj.entidad_responsable.all().values_list("nombre", flat=True)
        # entidades donde es admin
        entidades_admin = obj.gestionentidad_set.all().values_list("entidad__nombre", flat=True)

        # Unimos todo y quitamos duplicados
        nombres = set(entidades_usuario) | set(entidades_responsable) | set(entidades_admin)
        return list(nombres)


class EntidadSerializer(serializers.ModelSerializer):
    foto_portada = serializers.ImageField(use_url=True)
    

    responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="responsable"),
        source="responsable",
        required=False,
        allow_null=True
    )
    responsable = UserSerializer(read_only=True)

    usuarios_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="usuario"),
        source="usuarios",
        many=True,
        required=False
    )
    usuarios = UserSerializer(many=True, read_only=True)

    administrador_id = serializers.SerializerMethodField(read_only=True) 
    administrador_input = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="admin"),
        source="administrador",
        write_only=True,
        required=False,
        allow_null=True
    )
    administrador = UserSerializer(read_only=True)

    class Meta:
        model = Entidad
        fields = [
            "id", "nombre", "correo", "telefono","descripcion", "foto_portada",
            "responsable", "responsable_id",
            "usuarios", "usuarios_ids",
            "administrador", "administrador_id", "administrador_input"
        ]

    def get_administrador_id(self, obj):
        # Buscar el administrador asociado desde GestionEntidad
        gestion = GestionEntidad.objects.filter(entidad=obj).first()
        return gestion.administrador.id if gestion else None

    def create(self, validated_data):
        # Extraer relaciones
        usuarios = validated_data.pop("usuarios", [])
        administrador = validated_data.pop("administrador", None)

        # ✅ Asegurar que la descripción se tome incluso si no está en validated_data
        descripcion = self.initial_data.get("descripcion", None)
        if descripcion is not None:
            validated_data["descripcion"] = descripcion

        # Crear entidad
        entidad = Entidad.objects.create(**validated_data)

        # Relaciones M2M y FK
        if usuarios:
            entidad.usuarios.set(usuarios)
        if administrador:
            GestionEntidad.objects.create(entidad=entidad, administrador=administrador)

        entidad.save()
        return entidad

    def update(self, instance, validated_data):
        usuarios = validated_data.pop("usuarios", None)
        administrador = validated_data.pop("administrador", None)
        instance = super().update(instance, validated_data)
        if usuarios is not None:
            instance.usuarios.set(usuarios)
        if administrador:
            GestionEntidad.objects.update_or_create(entidad=instance, defaults={"administrador": administrador})
        instance.save()
        return instance

# En accounts/serializers.py

class AnuncioSerializer(serializers.ModelSerializer):
    entidad_nombre = serializers.CharField(source="entidad.nombre", read_only=True)
    entidad_id = serializers.IntegerField(source="entidad.id", read_only=True)

    comentarios_rechazo = serializers.SerializerMethodField()
    usuario_id = serializers.IntegerField(source="usuario.id", read_only=True)
    
    def update(self, instance, validated_data):
        
        # 1. Revisa si un 'archivo_pdf' NUEVO viene en la petición
        if 'archivo_pdf' in validated_data:
            if instance.archivo_pdf: # Si ya tenía un PDF...
                instance.archivo_pdf.delete(save=False) # ...bórralo.
        
        # 2. Revisa si un 'banner' NUEVO viene en la petición
        if 'banner' in validated_data:
            if instance.banner: # Si ya tenía un banner...
                instance.banner.delete(save=False) # ...bórralo.
        
        # 3. Llama al 'update' normal para que guarde los nuevos datos
        return super().update(instance, validated_data)


    class Meta:
        model = Anuncio
        fields = "__all__"
        read_only_fields = ["usuario"]

    def get_comentarios_rechazo(self, obj):
        aprobacion = obj.aprobaciones_responsable.last()
        if aprobacion and not aprobacion.aprobado:
            return aprobacion.comentarios_rechazo
        return None


class NotificacionSerializer(serializers.ModelSerializer):
    destinatario = UserSerializer(read_only=True)
    destinatario_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="destinatario", write_only=True
    )
    anuncio = AnuncioSerializer(read_only=True)
    anuncio_id = serializers.PrimaryKeyRelatedField(
        queryset=Anuncio.objects.all(), source="anuncio", write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Notificacion
        fields = ["id", "mensaje", "fecha", "visto", "destinatario", "destinatario_id", "anuncio", "anuncio_id", "banner"]
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
        fields = ["first_name", "last_name", "email", "role", "is_active"]
        read_only_fields = ["is_active"]

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
            is_active=False,
        )

        return user
    
class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)
