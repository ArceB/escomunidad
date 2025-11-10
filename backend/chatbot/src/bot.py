import os
import time
import json
from datetime import datetime
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

# --- 👇 1. AÑADIMOS UNA LISTA DE PALABRAS SEGURAS ---
# Palabras de una sola sílaba que SÍ queremos responder (como saludos)
PALABRAS_SEGURAS_DE_UNA_SOLA_PALABRA = {
    "hola", "gracias", "adios", "menu", "ayuda", "ok", "si", "no", 
    "buenos", "dias", "tardes", "noches"
}
# -----------------------------------------------------


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
                model="kwaipilot/kat-coder-pro:free",
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
        # ... (Tu lógica de procesar_pdf se queda igual)
        print(f"  [procesar_pdf] Iniciando para: {pdf_path}")
        try:
            if not self.db:
                print("  [procesar_pdf] ❌ Error: La conexión a ChromaDB es Nula.")
                return
            if not os.path.exists(pdf_path):
                print(f"  [procesar_pdf] ❌ Error: El archivo {pdf_path} no existe. Omitiendo.")
                return
            file_name = os.path.basename(pdf_path)
            print(f"  [procesar_pdf] 1. Intentando borrar chunks antiguos para 'source': {file_name}")
            try:
                self.db.delete(where={"source": file_name})
                print(f"  [procesar_pdf] 2. Borrado de chunks antiguos (si existían) completado.")
            except Exception as e:
                print(f"  [procesar_pdf] ⚠️ Aviso: No se pudieron borrar chunks antiguos (puede ser normal si no existían): {e}")
            print(f"  [procesar_pdf] 3. Procesando chunks (chunk_pdfs)...")
            chunks = chunk_pdfs(pdf_path)
            if chunks:
                print(f"  [procesar_pdf] 4. Guardando {len(chunks)} chunks en ChromaDB...")
                save_to_chroma_db(chunks, self.modelo_embeddings)
                print(f"  [procesar_pdf] 5. ✅ PDF {file_name} procesado y guardado.")
            else:
                print(f"  [procesar_pdf] ⚠️ Aviso: El archivo {file_name} no generó chunks.")
        except Exception as e:
            print(f"💥 [procesar_pdf] Error fatal procesando PDF ({pdf_path}): {e}")

    # =========================
    # ACCIÓN 2: Eliminar un PDF (Llamada por Señales)
    # =========================
    def eliminar_pdf(self, pdf_name: str):
        # ... (Tu lógica de eliminar_pdf se queda igual)
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
    def ask(self, pregunta: str, context_id: str = None) -> str:
        print(f"🤔 [ask] Iniciando con la pregunta: {pregunta}")
        
        # --- 👇 2. NUEVA VALIDACIÓN DE AMBIGÜEDAD ---
        pregunta_limpia = pregunta.strip().lower()
        num_palabras = len(pregunta_limpia.split())

        # Si la pregunta es solo 1 palabra Y no es un saludo/agradecimiento
        if (num_palabras == 1 and pregunta_limpia not in PALABRAS_SEGURAS_DE_UNA_SOLA_PALABRA):
            print("  -> [ask] ⚠️ Pregunta demasiado ambigua (1 palabra). Pidiendo contexto.")
            # No guardamos esto en el historial, solo pedimos aclaración
            return "Tu pregunta es muy corta (ej. 'becas', 'inscripción'). ¿Podrías darme más contexto? (Por ejemplo, '¿requisitos de la beca Telmex?' o '¿cuándo es la inscripción al servicio social?')"
        # --- FIN DE LA VALIDACIÓN ---
        
        print(f"  -> Contexto de Anuncio ID: {context_id}")
        
        if not self.db:
            return "Lo siento, la base de datos de conocimiento no está conectada."
        
        # --- 1. OBTENER HISTORIAL ---
        historial_texto = "\n".join(
            f"Usuario: {m.content}" if isinstance(m, HumanMessage) else f"Asistente: {m.content}"
            for m in self.historial.messages
        )

        # --- 2. PASO DE CLASIFICACIÓN Y RE-ESCRITURA ---
        pregunta_para_busqueda = pregunta
        es_seguimiento = False 
        
        if self.historial.messages:
            print("  -> [ask] Hay historial, clasificando y re-escribiendo la pregunta...")
            
            REWRITE_PROMPT_TEMPLATE = """
Basado en el "Historial de chat", analiza la "Pregunta Actual".
Decide si la pregunta es un seguimiento directo del historial ("SEGUIMIENTO") o si es un "TEMA_NUEVO".
Luego, re-escribe la "Pregunta Actual" para que sea una consulta independiente.
Responde ÚNICAMENTE con un objeto JSON con las claves "tipo" y "pregunta_reescrita".

Historial de chat:
{chat_history}

Pregunta Actual:
{question}

Tu respuesta JSON:
"""
            try:
                rewrite_prompt = ChatPromptTemplate.from_template(REWRITE_PROMPT_TEMPLATE).format(
                    chat_history=historial_texto,
                    question=pregunta
                )
                
                if not self.modelo:
                    print("  -> [ask] ⚠️ No hay modelo LLM para re-escribir, usando pregunta original.")
                else:
                    respuesta_llm = self.modelo.invoke([HumanMessage(content=rewrite_prompt)])
                    print(f"  -> [ask] Respuesta JSON del LLM: {respuesta_llm.content}")
                    
                    json_string = respuesta_llm.content.strip().replace("```json\n", "").replace("\n```", "")
                    info_pregunta = json.loads(json_string)
                    
                    pregunta_para_busqueda = info_pregunta.get("pregunta_reescrita", pregunta)
                    if info_pregunta.get("tipo", "TEMA_NUEVO") == "SEGUIMIENTO":
                        es_seguimiento = True
                
                print(f"  -> [ask] Pregunta re-escrita: {pregunta_para_busqueda}")
                print(f"  -> [ask] Es seguimiento: {es_seguimiento}")
                
            except Exception as e:
                print(f"💥 [ask] Error al re-escribir/clasificar (se usará la pregunta original): {e}")
                pregunta_para_busqueda = pregunta
                es_seguimiento = False
        else:
             print("  -> [ask] No hay historial, se considera TEMA_NUEVO.")

        # --- 3. LÓGICA DE FILTRADO (¡MEJORADA!) ---
        search_kwargs = {"k": 5}
        
        if context_id and es_seguimiento:
            nombre_archivo = f"anexo_anuncio_{context_id}.pdf"
            search_kwargs['filter'] = {"source": nombre_archivo}
            print(f"  -> BÚSQUEDA FILTRADA (es seguimiento) por: {nombre_archivo}")
        else:
            print(f"  -> BÚSQUEDA GENERAL (es tema nuevo o no hay contexto)")
            
        try:
            documentos_relacionados = self.db.similarity_search_with_score(
                pregunta_para_busqueda, 
                **search_kwargs
            )
            contexto = "\n\n---\n\n".join([doc.page_content for doc, _ in documentos_relacionados])
            print(f"📚 [ask] Documentos recuperados: {len(documentos_relacionados)}")
        except Exception as e:
            print(f"💥 [ask] Error en similarity_search: {e}")
            contexto = ""

        # --- 4. OBTENER FECHA Y CREAR PROMPT FINAL ---
        hoy = datetime.now().strftime("%Y-%m-%d") 

        PLANTILLA_PROMPT = """
Eres un asistente llamado PoliChat experto en responder preguntas basadas en documentos proporcionados.

**La fecha actual es: {fecha_actual}**

🔹 Instrucciones:
- Usa la "Fecha Actual" como referencia para determinar si los eventos en el contexto están en **pasado, presente o futuro**. (Ej. si la fecha actual es 2025-11-10 y el evento fue en 2025-10-03, debes usar el tiempo pasado).
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
                fecha_actual=hoy,
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

        # --- 5. LLAMADA AL LLM Y GUARDADO EN HISTORIAL ---
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
print("--- Inicializando instancia global del ChatBot ---")
bot_global = ChatBot()
print("--- Instancia global del ChatBot CREADA ---")