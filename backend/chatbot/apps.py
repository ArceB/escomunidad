# en chatbot/apps.py

from django.apps import AppConfig

class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

    def ready(self):
        try:
            import chatbot.signals
            print("💡 Señales del Chatbot cargadas correctamente.")
        except ImportError:
            pass