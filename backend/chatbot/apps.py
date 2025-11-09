# en chatbot/apps.py

from django.apps import AppConfig
import os  # <-- Importamos 'os'

class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'

    def ready(self):
        # Esta variable de entorno 'RUN_MAIN' solo es 'true'
        # en el proceso principal de runserver, no en el "reloader".
        if os.environ.get('RUN_MAIN') == 'true':
            try:
                import chatbot.signals
                print("💡 Señales del Chatbot cargadas (Proceso Principal ÚNICO).")
            except ImportError:
                pass