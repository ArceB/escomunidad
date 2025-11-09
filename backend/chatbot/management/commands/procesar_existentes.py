# en chatbot/management/commands/procesar_existentes.py

import os
from django.core.management.base import BaseCommand
from django.conf import settings
from chatbot.src.bot import bot_global # Importamos nuestro bot

class Command(BaseCommand):
    help = 'Escanea la carpeta de PDFs y los procesa/sincroniza en ChromaDB.'

    def handle(self, *args, **options):
        self.stdout.write("⚙️ Iniciando escaneo de PDFs existentes...")
        
        PDFS_DIR = os.path.join(settings.MEDIA_ROOT, "anuncios", "pdfs")
        if not os.path.exists(PDFS_DIR):
            self.stderr.write(f"❌ La carpeta {PDFS_DIR} no existe.")
            return

        for filename in os.listdir(PDFS_DIR):
            if filename.endswith(".pdf"):
                pdf_path = os.path.join(PDFS_DIR, filename)
                self.stdout.write(f"--- Procesando: {filename} ---")
                try:
                    # Llama a la acción 1 (procesar) de tu bot
                    bot_global.procesar_pdf(pdf_path)
                except Exception as e:
                    self.stderr.write(f"❌ Error con {filename}: {e}")
        
        self.stdout.write("\n✅ ¡Éxito! Todos los PDFs existentes han sido procesados.")