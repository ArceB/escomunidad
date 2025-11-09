# en chatbot/src/bot.py
import os
import time
from threading import Thread
from openai import RateLimitError
from django.conf import settings
from .text_processor import chunk_pdfs
from .chroma_db import save_to_chroma_db, CHROMA_PATH
from langchain_chroma import Chroma

from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage


# =========================
# Configuración de OpenRouter
# =========================

os.environ["OPENAI_API_KEY"] = "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" 
os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"

# =========================
# Carpeta de PDFs
# =========================
PDFS_DIR = os.path.join(settings.MEDIA_ROOT, "anuncios", "pdfs")


class ChatBot:
    """
    Esta clase es una 'caja de herramientas' (Singleton).
    Solo inicializa los modelos una vez y define las acciones.
    NO procesa nada ni crea hilos al arrancar.
    """
    def __init__(self):
        print("⚙️ [__init__] Inicializando ChatBot (Modelos y DB)...")
        self.modelo_embeddings = None
        self.modelo = None
        self.db = None
        
        try:
            print("  -> [__init__] Cargando embeddings...")
            self.modelo_embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"local_files_only": True}
            )
        except Exception as e:
            print(f"💥 [__init__] Error cargando embeddings: {e}")

        try:
            print("  -> [__init__] Cargando modelo LLM...")
            self.modelo = ChatOpenAI(
                model="meta-llama/llama-3.3-70b-instruct:free",
                temperature=0.1,
                openai_api_key=os.environ["OPENAI_API_KEY"],
                openai_api_base=os.environ["OPENAI_API_BASE"],
            )
        except Exception as e:
            print(f"💥 [__init__] Error inicializando modelo LLM: {e}")

        try:
            print("  -> [__init__] Conectando a ChromaDB...")
            if self.modelo_embeddings:
                self.db = Chroma(
                    persist_directory=CHROMA_PATH,
                    embedding_function=self.modelo_embeddings
                )
            else:
                 print(f"💥 [__init__] No se pudo conectar a ChromaDB porque los embeddings fallaron.")
        except Exception as e:
            print(f"💥 [__init__] Error cargando BD Chroma: {e}")

        self.historial = InMemoryChatMessageHistory()
        print("✅ [__init__] ChatBot listo y en espera de señales.")
    
    
    # =========================
    # ACCIÓN 1: Procesar un PDF (Llamada por Señales)
    # =========================
    def procesar_pdf(self, pdf_path: str):
        """
        Procesa (o reprocesa) y guarda un SOLO PDF en ChromaDB.
        """
        print(f"  [procesar_pdf] Iniciando para: {pdf_path}")
        try:
            if not self.db:
                print("  [procesar_pdf] ❌ Error: La conexión a ChromaDB es Nula.")
                return

            if not os.path.exists(pdf_path):
                print(f"  [procesar_pdf] ❌ Error: El archivo {pdf_path} no existe. Omitiendo.")
                return
            
            file_name = os.path.basename(pdf_path)
            
            # --- Lógica de borrado (CON EL TRY/EXCEPT CORREGIDO) ---
            print(f"  [procesar_pdf] 1. Intentando borrar chunks antiguos para 'source': {file_name}")
            try:
                self.db.delete(where={"source": file_name})
                print(f"  [procesar_pdf] 2. Borrado de chunks antiguos (si existían) completado.")
            except Exception as e:
                # ¡AQUÍ ESTÁ LA MAGIA!
                # Capturamos el error aquí y lo reportamos, PERO CONTINUAMOS.
                print(f"  [procesar_pdf] ⚠️ Aviso: No se pudieron borrar chunks antiguos (puede ser normal si no existían): {e}")
            
            # --- Lógica de procesamiento (AHORA SÍ SE EJECUTARÁ) ---
            print(f"  [procesar_pdf] 3. Procesando chunks (chunk_pdfs)...")
            chunks = chunk_pdfs(pdf_path) # Tu función de text_processor.py
            
            if chunks:
                print(f"  [procesar_pdf] 4. Guardando {len(chunks)} chunks en ChromaDB...")
                save_to_chroma_db(chunks, self.modelo_embeddings) # Tu función de chroma_db.py
                print(f"  [procesar_pdf] 5. ✅ PDF {file_name} procesado y guardado.")
            else:
                print(f"  [procesar_pdf] ⚠️ Aviso: El archivo {file_name} no generó chunks.")
                
        except Exception as e:
            print(f"💥 [procesar_pdf] Error fatal procesando PDF ({pdf_path}): {e}")

    # =========================
    # ACCIÓN 2: Eliminar un PDF (Llamada por Señales)
    # =========================
    def eliminar_pdf(self, pdf_name: str):
        """
        Elimina todos los chunks de un PDF de ChromaDB usando su nombre de archivo.
        """
        print(f"  [eliminar_pdf] Iniciando para: {pdf_name}")
        try:
            if not self.db:
                print("  [eliminar_pdf] ❌ Error: La conexión a ChromaDB es Nula.")
                return

            print(f"  [eliminar_pdf] 1. Intentando borrar chunks para 'source': {pdf_name}")
            self.db.delete(where={"source": pdf_name})
            print(f"  [eliminar_pdf] 2. ✅ PDF {pdf_name} eliminado de ChromaDB.")
        except Exception as e:
            print(f"💥 [eliminar_pdf] Error fatal eliminando PDF ({pdf_name}): {e}")

    # =========================
    # ACCIÓN 3: Preguntar al Chatbot (Llamada por Vistas)
    # =========================
    def ask(self, pregunta: str) -> str:
        print(f"🤔 [ask] Iniciando con la pregunta: {pregunta}")
        
        if not self.db:
            return "Lo siento, la base de datos de conocimiento no está conectada."
        
        try:
            documentos_relacionados = self.db.similarity_search_with_score(pregunta, k=5)
            contexto = "\n\n---\n\n".join([doc.page_content for doc, _ in documentos_relacionados])
            print(f"📚 [ask] Documentos recuperados: {len(documentos_relacionados)}")
        except Exception as e:
            print(f"💥 [ask] Error en similarity_search: {e}")
            contexto = ""

        historial_texto = "\n".join(
            f"Usuario: {m.content}" if isinstance(m, HumanMessage) else f"Asistente: {m.content}"
            for m in self.historial.messages
        )

        PLANTILLA_PROMPT = """
Eres un asistente llamado PoliChat experto en responder preguntas basadas en documentos proporcionados.

🔹 Instrucciones:
- Da respuestas **claras y concisas** (máx. 1-2 frases).
- Si corresponde, usa **listas o viñetas** para estructurar la información.
- No inventes datos que no estén en el contexto.
- Mantén un tono natural y conversacional.

📂 Contexto disponible:
{context}

💬 Historial de conversación previa:
{chat_history}

❓ Pregunta actual:
{question}

✍️ Respuesta:
"""
        try:
            prompt_template = ChatPromptTemplate.from_template(PLANTILLA_PROMPT)
            prompt = prompt_template.format(
                context=contexto,
                chat_history=historial_texto,
                question=pregunta
            )
            print(f"📝 [ask] Prompt generado (primeros 300 chars): {prompt[:300]}")
        except Exception as e:
            print(f"💥 [ask] Error generando prompt: {e}")
            return "⚠ Error generando prompt"

        if not self.modelo:
            return "Lo siento, el modelo LLM no está conectado."

        # Llamada con reintento
        while True:
            try:
                print("⚡ [ask] Llamando al modelo en OpenRouter...")
                respuesta = self.modelo.invoke([HumanMessage(content=prompt)])
                print("✅ [ask] Respuesta recibida del modelo.")
                break
            except RateLimitError:
                print("⏳ [ask] Rate limit, reintentando en 60s...")
                time.sleep(60)
            except Exception as e:
                print(f"💥 [ask] Error llamando al modelo: {e}")
                return "⚠ Error llamando al modelo"

        # Guardar en historial
        try:
            self.historial.add_message(HumanMessage(content=pregunta))
            self.historial.add_message(AIMessage(content=respuesta.content))
        except Exception as e:
            print("⚠ [ask] Error guardando en historial:", e)

        return respuesta.content.strip()


# =========================
# Instancia Única (Singleton)
# =========================
# Django cargará este archivo una vez, creando una sola instancia del bot
# que vivirá en la memoria del servidor.
print("--- Inicializando instancia global del ChatBot ---")
bot_global = ChatBot()
print("--- Instancia global del ChatBot CREADA ---")