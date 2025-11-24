# chatbot/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from accounts.models import Anuncio
import os

from chatbot.src.bot import bot_global

# Ruta donde guardas los PDFs generados automáticamente
from django.conf import settings
PDFS_DIR = os.path.join(settings.MEDIA_ROOT, "anuncios", "pdfs")


def ruta_pdf_info(anuncio_id: int) -> str:
    """
    Construye la ruta completa del PDF informativo.
    """
    return os.path.join(PDFS_DIR, f"info_anuncio_{anuncio_id}.pdf")


@receiver(post_save, sender=Anuncio)
def procesar_anuncio_guardado(sender, instance, **kwargs):
    print(f"✅ SEÑAL (post_save) RECIBIDA: Anuncio ID {instance.id}")

    # 1️⃣ Procesar ANEXO (si existe)
    if instance.archivo_pdf and hasattr(instance.archivo_pdf, 'path') and os.path.exists(instance.archivo_pdf.path):
        print(f"  -> Procesando ANEXO: {instance.archivo_pdf.path}")
        bot_global.procesar_pdf(instance.archivo_pdf.path)
    else:
        print("  -> No hay anexo para procesar.")

    # 2️⃣ Procesar PDF INFORMÁTIVO (si existe)
    pdf_info_path = os.path.join(
        "media",
        "anuncios",
        "pdfs",
        f"info_anuncio_{instance.id}.pdf"
    )

    if os.path.exists(pdf_info_path):
        print(f"  -> Procesando PDF informativo: {pdf_info_path}")
        bot_global.procesar_pdf(pdf_info_path)
    else:
        print("  -> No existe el PDF informativo todavía.")



@receiver(post_delete, sender=Anuncio)
def procesar_anuncio_eliminado(sender, instance, **kwargs):
    print(f"✅ SEÑAL (post_delete) RECIBIDA: Anuncio ID {instance.id}")

    # 1️⃣ Eliminar chunks del PDF real si existía
    if instance.archivo_pdf:
        nombre_pdf = os.path.basename(instance.archivo_pdf.name)
        print(f"  -> Eliminando chunks del archivo real: {nombre_pdf}")
        bot_global.eliminar_pdf(nombre_pdf)

    # 2️⃣ Eliminar chunks del PDF informativo
    info_name = f"info_anuncio_{instance.id}.pdf"
    print(f"  -> Eliminando chunks del PDF informativo: {info_name}")
    bot_global.eliminar_pdf(info_name)
