import os
from langchain_chroma import Chroma
from langchain_core.documents import Document

# 📂 Carpetas (¡MODIFICADO!)
# La única ruta que este archivo necesita es la de la propia BD de Chroma.
# Ya no necesita 'DOCS_DIR' porque 'bot.py' maneja la lógica de limpieza.
BASE_DIR_APP = os.path.dirname(os.path.dirname(__file__))  # → backend/chatbot
CHROMA_PATH = os.path.join(BASE_DIR_APP, "chroma")

def save_to_chroma_db(chunks: list[Document], embedding_model) -> Chroma:
    """
    Guarda (o sobreescribe) chunks en Chroma.
    
    Esta función ahora es 'tonta': simplemente añade lo que le pasan.
    La lógica de 'bot.py' (el hilo) ya decidió si estos chunks son nuevos
    o si son de un archivo actualizado.
    """
    # Inicializar la base de datos
    db = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embedding_model
    )

    if not chunks:
        print("⚠️ save_to_chroma_db fue llamado sin chunks.")
        return db

    # Obtener el 'source' (nombre de archivo)
    # Asumimos que todos los chunks vienen del mismo archivo
    source_file = chunks[0].metadata.get("source")
    
    if not source_file:
        print("💥 Error: Los chunks no tienen metadata 'source'. No se guardará nada.")
        return db

    # --- Lógica de Actualización ---
    # 1. Borramos cualquier chunk existente de ESE MISMO archivo
    #    Esto es vital para que las 'actualizaciones' (borrar y subir) funcionen.
    print(f"🔄 Sincronizando {source_file}: Borrando chunks antiguos (si existen)...")
    try:
        db.delete(where={"source": source_file})
    except Exception as e:
        # Esto no es un error fatal, puede que el archivo sea 100% nuevo
        print(f"Aviso: No se pudieron borrar chunks antiguos (quizás no existían): {e}")

    # 2. Añadimos los nuevos chunks
    print(f"✅ Guardando {len(chunks)} nuevos chunks para {source_file}...")
    ids = [f"{source_file}_{i}" for i, doc in enumerate(chunks)]
    db.add_documents(chunks, ids=ids)

    return db