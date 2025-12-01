from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Agregar el rol dentro del token
        token['role'] = user.role
        token["first_name"] = user.first_name 
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role  # <-- aquí es lo que falta ahora
        return data
