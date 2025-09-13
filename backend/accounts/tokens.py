from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Campos extra dentro del JWT
        token["role"] = user.role
        token["username"] = user.username
        if user.entidad_id:
            token["entidad_id"] = user.entidad_id
        return token
