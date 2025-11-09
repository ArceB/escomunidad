# en chatbot/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from accounts.models import Anuncio  # Importamos el modelo Anuncio
import os

# Importamos la instancia ÚNICA de nuestro bot
from chatbot.src.bot import bot_global


@receiver(post_save, sender=Anuncio)
def procesar_anuncio_guardado(sender, instance, **kwargs):
    """
    Se dispara CADA VEZ que un Anuncio se crea o se actualiza.
    """
    print(f"✅ SEÑAL (post_save) RECIBIDA: Anuncio ID {instance.id}")
    
    if instance.archivo_pdf and hasattr(instance.archivo_pdf, 'path'):
        if os.path.exists(instance.archivo_pdf.path):
            # Llama a la ACCIÓN 1 de nuestro bot
            bot_global.procesar_pdf(instance.archivo_pdf.path)
        else:
            print(f"  -> El archivo {instance.archivo_pdf.name} no se encontró en el disco.")
    else:
        print("  -> Anuncio guardado sin PDF, no hay nada que procesar.")


@receiver(post_delete, sender=Anuncio)
def procesar_anuncio_eliminado(sender, instance, **kwargs):
    """
    Se dispara CADA VEZ que un Anuncio se elimina.
    """
    print(f"✅ SEÑAL (post_delete) RECIBIDA: Anuncio ID {instance.id}")
    
    if instance.archivo_pdf:
        # Llama a la ACCIÓN 2 de nuestro bot
        # Pasamos solo el nombre, ya que el archivo físico ya no existe
        bot_global.eliminar_pdf(os.path.basename(instance.archivo_pdf.name))
    else:
        print("  -> Anuncio eliminado sin PDF, no hay nada que borrar de ChromaDB.")