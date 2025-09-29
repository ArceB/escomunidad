import os
import time
import requests
from threading import Thread
from openai import RateLimitError  # Ya no se usará, pero si lo necesitas puedes mantenerlo

from .text_processor import chunk_pdfs
from .chroma_db import save_to_chroma_db, CHROMA_PATH
from langchain_chroma import Chroma

from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage


# =========================
# Configuración de LM Studio
# =========================
LM_STUDIO_URL = "https://undeficient-magen-overaggressively.ngrok-free.dev/v1/chat/completions"  # Endpoint corregido
MODEL_NAME = "meta-llama-3.1-8b-instruct"  # Nombre del modelo que proporcionó LM Studio

# =========================
# Carpeta de PDFs
# =========================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # → backend/chatbot
PDFS_DIR = os.path.abspath(os.path.join(BASE_DIR, "documents"))
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
            # Recuperamos los documentos relevantes
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

        # Ajustamos el prompt para respuestas más concisas
        prompt = f"""
        Eres un asistente llamado PoliChat experto en responder preguntas basadas en documentos proporcionados.

        🔹 Instrucciones:
        - Da respuestas **claras y concisas** (máx. 2-3 frases).
        - No incluyas demasiados detalles, mantén la respuesta breve y directa.
        - Si es necesario, usa viñetas o listas para estructurar la respuesta.

        📂 Contexto disponible:
        {contexto}

        💬 Historial de conversación previa:
        {historial_texto}

        ❓ Pregunta actual:
        {pregunta}

        ✍️ Respuesta:
        """
        
        print("📝 Prompt generado:", prompt[:300])  # Imprime solo los primeros 300 caracteres

        # Verifica que el prompt no esté vacío
        if not prompt.strip():
            return "⚠ Error: el prompt está vacío"

        # Llamada con reintento a LM Studio
        while True:
            try:
                print(f"⚡ Llamando al modelo en LM Studio... (URL: {LM_STUDIO_URL})")

                # Realizar la llamada al modelo
                response = requests.post(
                    LM_STUDIO_URL,
                    json={"model": MODEL_NAME, "messages": [{"role": "user", "content": prompt}]},
                )

                if response.status_code == 200:
                    respuesta = response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                    if not respuesta:
                        print("⚠ El modelo no generó respuesta. Revisando el prompt...")
                    print("✅ Respuesta recibida del modelo:", respuesta)
                    break
                else:
                    print(f"💥 Error en la llamada al modelo: {response.status_code}, {response.text}")
                    return "⚠ Error llamando al modelo"
            except Exception as e:
                print("💥 Error llamando al modelo:", e)
                return "⚠ Error llamando al modelo"

        # Guardar en historial
        try:
            self.historial.add_message(HumanMessage(content=pregunta))
            self.historial.add_message(AIMessage(content=respuesta))
        except Exception as e:
            print("⚠ Error guardando en historial:", e)

        return respuesta.strip()
