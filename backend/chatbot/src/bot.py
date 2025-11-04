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
os.makedirs(PDFS_DIR, exist_ok=True)


class ChatBot:
    def __init__(self):
        # =========================
        # Inicializar embeddings
        # =========================
        try:
            print("⚙️ Inicializando embeddings...")
            self.modelo_embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"local_files_only": True}
            )
            print("✅ Embeddings cargados correctamente")
        except Exception as e:
            print("💥 Error cargando embeddings:", e)
            self.modelo_embeddings = None

        # =========================
        # Historial
        # =========================
        self.historial = InMemoryChatMessageHistory()

        # =========================
        # Modelo LLM (OpenRouter)
        # =========================
        try:
            print("⚙️ Inicializando modelo LLM en OpenRouter...")
            self.modelo = ChatOpenAI(
<<<<<<< HEAD
                model="meta-llama/llama-3.3-70b-instruct:free",
=======
                model="nvidia/nemotron-nano-12b-v2-vl:free",
>>>>>>> origin/rama-hugo-nueva
                temperature=0.1,
                openai_api_key=os.environ["OPENAI_API_KEY"],
                openai_api_base=os.environ["OPENAI_API_BASE"],
            )
            print("✅ Modelo LLM listo")
        except Exception as e:
            print("💥 Error inicializando modelo LLM:", e)
            self.modelo = None

        # =========================
        # BD Chroma persistente
        # =========================
        try:
            print("📦 Cargando base de datos Chroma persistente...")
            self.db = Chroma(
                persist_directory=CHROMA_PATH,
                embedding_function=self.modelo_embeddings
            )
        except Exception as e:
            print("💥 Error cargando BD Chroma:", e)
            self.db = None

        # PDFs procesados
        self.PROCESADOS = set()
        self._procesar_documentos_iniciales()

        # =========================
        # Hilo de monitoreo de PDFs
        # =========================
        self.thread = Thread(target=self._revisar_pdfs, daemon=True)
        self.thread.start()

    # =========================
    # Procesar PDFs iniciales
    # =========================
    def _procesar_documentos_iniciales(self):
        documentos_iniciales = []
        try:
            for filename in os.listdir(PDFS_DIR):
                if filename.endswith(".pdf"):
                    pdf_path = os.path.join(PDFS_DIR, filename)
                    print(f"📄 Procesando {filename}...")
                    chunks = chunk_pdfs(pdf_path)
                    documentos_iniciales.extend(chunks)
                    self.PROCESADOS.add(filename)

            if documentos_iniciales:
                self.db = save_to_chroma_db(documentos_iniciales, self.modelo_embeddings)
                print(f"✅ Se procesaron {len(documentos_iniciales)} chunks iniciales")
        except Exception as e:
            print("💥 Error procesando PDFs iniciales:", e)

    # =========================
    # Monitoreo continuo de PDFs
    # =========================
    def _revisar_pdfs(self):
        while True:
            try:
                archivos_actuales = {f for f in os.listdir(PDFS_DIR) if f.endswith(".pdf")}

                # Nuevos
                nuevos = archivos_actuales - self.PROCESADOS
                for filename in nuevos:
                    pdf_path = os.path.join(PDFS_DIR, filename)
                    print(f"📄 Nuevo PDF detectado: {filename}")
                    chunks = chunk_pdfs(pdf_path)
                    self.db = save_to_chroma_db(chunks, self.modelo_embeddings)
                    self.PROCESADOS.add(filename)

                # Eliminados
                eliminados = self.PROCESADOS - archivos_actuales
                for filename in eliminados:
                    print(f"🗑 PDF eliminado: {filename}, borrando de Chroma...")
                    self.db.delete(where={"source": filename})
                    self.PROCESADOS.remove(filename)

            except Exception as e:
                print("💥 Error revisando PDFs:", e)

            time.sleep(30)

    # =========================
    # Método principal del chat
    # =========================
    def ask(self, pregunta: str) -> str:
        print("🤔 Iniciando ask() con la pregunta:", pregunta)
        try:
            documentos_relacionados = self.db.similarity_search_with_score(pregunta, k=5)
            contexto = "\n\n---\n\n".join([doc.page_content for doc, _ in documentos_relacionados])
            print(f"📚 Documentos recuperados: {len(documentos_relacionados)}")
        except Exception as e:
            print("💥 Error en similarity_search:", e)
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
            print("📝 Prompt generado (primeros 300 chars):", prompt[:300])
        except Exception as e:
            print("💥 Error generando prompt:", e)
            return "⚠ Error generando prompt"

        # Llamada con reintento
        while True:
            try:
                print("⚡ Llamando al modelo en OpenRouter...")
                respuesta = self.modelo.invoke([HumanMessage(content=prompt)])
                print("✅ Respuesta recibida del modelo:", respuesta)
                break
            except RateLimitError:
                print("⏳ Rate limit, reintentando en 60s...")
                time.sleep(60)
            except Exception as e:
                print("💥 Error llamando al modelo:", e)
                return "⚠ Error llamando al modelo"

        # Guardar en historial
        try:
            self.historial.add_message(HumanMessage(content=pregunta))
            self.historial.add_message(AIMessage(content=respuesta.content))
        except Exception as e:
            print("⚠ Error guardando en historial:", e)

        return respuesta.content.strip()
