# -*- coding: utf-8 -*-
import os
import time
import json
import json as jsonlib
import re  # Para limpiar texto
import logging

from dateparser import parse as parse_date
from datetime import datetime
from threading import Thread

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","event":"%(message)s"}'
)

try:
    from openai import RateLimitError
    from langdetect import detect, LangDetectException
    from langchain_chroma import Chroma
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_openai import ChatOpenAI
    from langchain_core.chat_history import InMemoryChatMessageHistory
    from langchain_core.messages import HumanMessage, AIMessage
except ImportError as e:
    print("="*50)
    print("ERROR: No se pudieron importar dependencias:", e)
    print("Instala las dependencias necesarias con:")
    print("pip install openai langdetect langchain-chroma langchain-huggingface langchain-openai")
    print("="*50)
    exit(1)


# --- Dependencias de Django (Opcional, solo para MEDIA_ROOT) ---
try:
    from django.conf import settings
    # Si Django no está configurado, usamos un valor por defecto
    if not settings.configured:
        settings.configure(MEDIA_ROOT=os.path.join(os.getcwd(), "media"))
except ImportError:
    print("Advertencia: Django no encontrado. Usando ruta por defecto './media' para MEDIA_ROOT.")
    # Creamos un objeto 'settings' falso para que el código funcione
    class MockSettings:
        MEDIA_ROOT = os.path.join(os.getcwd(), "media")
    settings = MockSettings()

# --- Tus dependencias locales (Asegúrate de que existan) ---
# (Usaremos Mocks si el archivo se ejecuta directamente)
try:
    from .text_processor import chunk_pdfs
    from .chroma_db import save_to_chroma_db, CHROMA_PATH
except ImportError:
    print("Advertencia: No se pudieron importar 'text_processor' o 'chroma_db'.")
    print("Se usarán Mocks (simulaciones) si se ejecuta este archivo directamente.")
    # Definir CHROMA_PATH si no se importó
    CHROMA_PATH = os.path.join(os.getcwd(), "db_chroma")
    
    # --- Mocks para text_processor y chroma_db ---
    def chunk_pdfs(pdf_path: str) -> list:
        print(f"ADVERTENCIA: Usando MOCK de chunk_pdfs para {pdf_path}.")
        file_name = os.path.basename(pdf_path)
        return [
            {"page_content": f"Este es el chunk 1 del documento {file_name}.", "metadata": {"source": file_name, "page": 1}},
            {"page_content": f"Este es el chunk 2 sobre pagos en {file_name}.", "metadata": {"source": file_name, "page": 2}},
        ]

    def save_to_chroma_db(chunks: list, embeddings_model):
        print(f"ADVERTENCIA: Usando MOCK de save_to_chroma_db. Simulando guardado de {len(chunks)} chunks.")
        try:
            temp_db = Chroma(
                persist_directory=CHROMA_PATH,
                embedding_function=embeddings_model
            )
            documents = [c["page_content"] for c in chunks]
            metadatas = [c["metadata"] for c in chunks]
            temp_db.add_texts(documents=documents, metadatas=metadatas)
            print("-> [Mock save_to_chroma_db] Guardado simulado con éxito.")
        except Exception as e:
            print(f"-> [Mock save_to_chroma_db] Error simulando guardado: {e}")
    # --- Fin de Mocks ---


# ==================================
# VARIABLES GLOBALES DE CONFIGURACIÓN
# ==================================
API_KEY = "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"
API_BASE = "https://openrouter.ai/api/v1"

# Modelo de Chat (LLM)
LLM_MODEL_NAME = "deepseek/deepseek-v3.2-exp"
# Modelo de Embeddings (Traductor)
EMBEDDINGS_MODEL_NAME = "BAAI/bge-m3"
# ==================================


# =========================
# Rutas
# =========================
PDFS_DIR = os.path.join(settings.MEDIA_ROOT, "anuncios", "pdfs")
# Asegurarse de que existan las carpetas necesarias
os.makedirs(CHROMA_PATH, exist_ok=True)
os.makedirs(PDFS_DIR, exist_ok=True)


PALABRAS_SEGURAS_DE_UNA_SOLA_PALABRA = {
    "hola", "gracias", "adios", "menu", "ayuda", "ok", "si", "no",
    "buenos", "dias", "tardes", "noches",

    # Palabras de resumen
    "resume",
    "resumen",
    "resumelo",
    "resúmelo",
    "resumir", "resumela"
}


#-------Palabras de resumen
RESUMEN_KEYWORDS = {
    "resume", "resumen", "resumelo", "resumir", 
    "hazme un resumen", "dame un resumen", 
    "más corto", "más resumido", "resumido"
}


# --- Lógica de Chitchat Mejorada (listas base) ---
SALUDOS_KEYWORDS = {"hola", "buenos dias", "buenas tardes", "buenas noches", "hey", "que tal", "buen dia"}
DESPEDIDAS_KEYWORDS = {"adios", "bye", "hasta luego", "nos vemos", "chao"}
AGRADECIMIENTOS_KEYWORDS = {"gracias", "muchas gracias", "mil gracias", "te lo agradezco"}
ESTADO_KEYWORDS = {"como estas", "como te va", "todo bien", "que tal estas"}
IDENTIDAD_KEYWORDS = {"quien eres", "que eres", "eres un bot", "que haces", "que puedes hacer"}


# =========================
# Funciones Helper
# =========================

def normalizar_texto(texto: str) -> str:
    """Limpia acentos, minúsculas y espacios."""
    texto = texto.lower().strip()
    # Quitar signos y espacios repetidos
    texto = re.sub(r"[^\w\sáéíóúüñ]", " ", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()

def limpiar_para_langdetect(texto: str) -> str:
    """
    Quita símbolos, emojis, números y deja solo letras y espacios
    para que langdetect no falle.
    """
    # Dejamos solo letras en español y espacios
    texto = re.sub(r"[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]", " ", texto.lower())
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()

def contiene_palabra_de(lista_palabras: set, texto: str) -> bool:
    """
    Detecta chitchat usando coincidencias REGEX por palabra/frase completa,
    evitando casos como 'holaresumen.pdf'.
    """
    for p in lista_palabras:
        pattern = rf"\b{re.escape(p)}\b"
        if re.search(pattern, texto):
            return True
    return False

def handle_chitchat_advanced(pregunta_limpia: str) -> str | None:

    if contiene_palabra_de(SALUDOS_KEYWORDS, pregunta_limpia):
        return "¡Hola! Soy PoliChat, tu asistente de anuncios. ¿En qué puedo ayudarte hoy?"

    if contiene_palabra_de(DESPEDIDAS_KEYWORDS, pregunta_limpia):
        return "¡Hasta luego! Si necesitas algo más, aquí estaré."

    if contiene_palabra_de(AGRADECIMIENTOS_KEYWORDS, pregunta_limpia):
        return "¡De nada! Me alegra poder ayudarte."

    if contiene_palabra_de(ESTADO_KEYWORDS, pregunta_limpia):
        return "Estoy funcionando correctamente y listo para ayudarte con la información de los anuncios. ¿Qué necesitas saber?"

    if contiene_palabra_de(IDENTIDAD_KEYWORDS, pregunta_limpia):
        return "Soy PoliChat, un asistente de IA diseñado para ayudarte a encontrar información en los anuncios y documentos de la comunidad."

    return None

class ChatBot:

    def __init__(self):
        logging.info(jsonlib.dumps({
            "event": "init_bot",
            "status": "initializing"
        }))

        # --- Carga Perezosa (Lazy Loading) ---
        self._modelo_embeddings = None
        self._modelo = None
        self._db = None

        # --- Estado en Memoria (STATEFUL) ---
        self.historial = InMemoryChatMessageHistory()
        self.sesiones_estado = {}
        self.cache_idioma = {}

        # caché simple de respuestas
        self.cache_respuestas = {}
        print("✅ [__init__] ChatBot listo (sin modelos cargados).")

    # =========================
    # Propiedades (Lazy Loading)
    # =========================

    @property
    def modelo_embeddings(self):
        """Carga perezosa para el modelo de embeddings."""
        if self._modelo_embeddings is None:
            print(" <i> [Lazy Load] Cargando embeddings por primera vez...")
            try:
                self._modelo_embeddings = HuggingFaceEmbeddings(
                    model_name=EMBEDDINGS_MODEL_NAME, # Usa variable global
                    model_kwargs={"local_files_only": False},
                    encode_kwargs={"normalize_embeddings": True}  # Normaliza embeddings
                )
                print(f" <i> [Lazy Load] Embeddings ({EMBEDDINGS_MODEL_NAME}) cargados.")
            except Exception as e:
                print(f"💥 [Lazy Load] Error fatal cargando embeddings: {e}")
        return self._modelo_embeddings

    @property
    def modelo(self):
        """Carga perezosa para el modelo LLM."""
        if self._modelo is None:
            print(" <i> [Lazy Load] Cargando modelo LLM por primera vez...")
            try:
                self._modelo = ChatOpenAI(
                    model=LLM_MODEL_NAME, # Usa variable global
                    temperature=0.1,
                    openai_api_key=API_KEY, # Usa variable global
                    openai_api_base=API_BASE, # Usa variable global
                )
                print(f" <i> [Lazy Load] Modelo LLM ({LLM_MODEL_NAME}) cargado.")
            except Exception as e:
                print(f"💥 [Lazy Load] Error fatal inicializando modelo LLM: {e}")
        return self._modelo

    @property
    def db(self):
        """Carga perezosa para la conexión a ChromaDB."""
        if self._db is None:
            print(f" <i> [Lazy Load] Conectando a ChromaDB en: {CHROMA_PATH}")
            try:
                if self.modelo_embeddings: # Dispara la carga de embeddings
                    self._db = Chroma(
                        persist_directory=CHROMA_PATH,
                        embedding_function=self.modelo_embeddings
                    )
                    print(" <i> [Lazy Load] Conexión a ChromaDB establecida.")
                else:
                    print("💥 [Lazy Load] No se pudo conectar a ChromaDB porque los embeddings fallaron.")
            except Exception as e:
                print(f"💥 [Lazy Load] Error cargando BD Chroma: {e}")
        return self._db

    # =========================
    # Gestión de PDFs (Sin cambios)
    # =========================
    def procesar_pdf(self, pdf_path: str):
        print(f" <i> [procesar_pdf] Iniciando para: {pdf_path}")
        try:
            if not self.db: # Dispara la carga de la DB
                print(" <i> [procesar_pdf] ❌ Error: La conexión a ChromaDB es Nula.")
                return
            if not os.path.exists(pdf_path):
                print(f" <i> [procesar_pdf] ❌ Error: El archivo {pdf_path} no existe. Omitiendo.")
                return
            
            file_name = os.path.basename(pdf_path)
            print(f" <i> [procesar_pdf] 1. Borrando chunks antiguos para 'source': {file_name}")
            try:
                self.db.delete(where={"source": file_name})
                print(f" <i> [procesar_pdf] 2. Borrado de chunks antiguos completado.")
            except Exception as e:
                print(f" <i> [procesar_pdf] ⚠️ Aviso: No se pudieron borrar chunks antiguos: {e}")
            
            print(f" <i> [procesar_pdf] 3. Procesando chunks...")
            chunks = chunk_pdfs(pdf_path) 
            if chunks:
                print(f" <i> [procesar_pdf] 4. Guardando {len(chunks)} chunks en ChromaDB...")
                save_to_chroma_db(chunks, self.modelo_embeddings) 
                print(f" <i> [procesar_pdf] 5. ✅ PDF {file_name} procesado y guardado.")
            else:
                print(f" <i> [procesar_pdf] ⚠️ Aviso: El archivo {file_name} no generó chunks.")
        except Exception as e:
            print(f"💥 [procesar_pdf] Error fatal procesando PDF ({pdf_path}): {e}")

    def eliminar_pdf(self, pdf_name: str):
        print(f" <i> [eliminar_pdf] Iniciando para: {pdf_name}")
        try:
            if not self.db:
                print(" <i> [eliminar_pdf] ❌ Error: La conexión a ChromaDB es Nula.")
                return
            print(f" <i> [eliminar_pdf] 1. Intentando borrar chunks para 'source': {pdf_name}")
            self.db.delete(where={"source": pdf_name})
            print(f" <i> [eliminar_pdf] 2. ✅ PDF {pdf_name} eliminado de ChromaDB.")
        except Exception as e:
            print(f"💥 [eliminar_pdf] Error fatal eliminando PDF ({pdf_name}): {e}")

    #manejo de fechas
    def _extraer_fechas(self, texto):
        patrones = [
            r"\d{1,2} de [a-zA-Z]+ de \d{4}",
            r"\d{1,2}/\d{1,2}/\d{4}",
            r"\d{4}-\d{2}-\d{2}"
        ]

        fechas = []
        for p in patrones:
            for f in re.findall(p, texto, flags=re.IGNORECASE):
                fechas.append(f)
        return fechas

    def _clasificar_fechas(self, lista_fechas):
        hoy = datetime.now()
        resultado = []

        for f in lista_fechas:
            dt = parse_date(f, languages=['es'])
            if not dt:
                continue

            if dt.date() < hoy.date():
                status = "PASADO"
            elif dt.date() > hoy.date():
                status = "FUTURO"
            else:
                status = "HOY"

            resultado.append((f, status))

        return resultado

    # =========================
    # Manejo de sesión / flujo (Estado en Memoria)
    # =========================
    def _get_session_id(self, context_id: str | None) -> str:
        return context_id or "global"

    def _get_session_state(self, session_id: str) -> dict:
        if session_id not in self.sesiones_estado:
            self.sesiones_estado[session_id] = {
                "flujo": None,
                "paso": 0,
                "datos": {},
                "ultimo_mensaje": None,
                "ultimo_timestamp": None,
            }
        return self.sesiones_estado[session_id]

    # =========================
    # Clasificación de intención (SIN CAMBIOS)
    # =========================
    def _detectar_intencion(self, pregunta_norm: str) -> str:
        # (Este es un ejemplo, puedes mejorar esta lógica)
        if any(p in pregunta_norm for p in ["problema", "fallo", "error", "no funciona", "soporte", "ayuda con"]):
            return "FLUJO_SOPORTE"
        if any(p in pregunta_norm for p in ["horario", "a que hora", "cuando atienden", "hora de atencion"]):
            return "HORARIO"
        if "ayuda" in pregunta_norm:
            return "AYUDA"
        return "RAG"
    
    ##Funcion para resumir
    def _resumir_ultima_respuesta(self):
        """
        Usa el LLM para resumir la última respuesta del chatbot.
        """
        # No hay historial suficiente
        if not self.historial.messages or len(self.historial.messages) < 2:
            return "No tengo información reciente para resumir."

        # Último mensaje del asistente
        ultimo = self.historial.messages[-1]
        if not isinstance(ultimo, AIMessage):
            return "No tengo información reciente para resumir."

        texto = ultimo.content

        prompt = f"""
    Resume el siguiente texto de forma breve, clara y concisa:

    Texto:
    {texto}

    Resumen:
    """

        try:
            respuesta = self.modelo.invoke([HumanMessage(content=prompt)])
            return respuesta.content.strip()
        except:
            return "Hubo un problema al generar el resumen."


    # =========================
    # Flujo guiado de soporte (SIN CAMBIOS)
    # =========================
    def _manejar_flujo_soporte(self, session_state: dict, pregunta: str, pregunta_norm: str) -> str:
        # (Esta lógica de flujo guiado no necesita cambios)
        paso = session_state.get("paso", 0)
        datos = session_state.get("datos", {})

        if paso == 0:
            session_state["flujo"] = "FLUJO_SOPORTE"
            session_state["paso"] = 1
            session_state["datos"] = {} # Limpiamos datos al iniciar
            return "Claro, te ayudo con soporte. Cuéntame brevemente cuál es el problema que estás teniendo."
        
        # (Faltaba validación de correo/teléfono, la agrego como ejemplo)
        # (Tu código original no la tenía, pero es buena práctica)
        from .chatbot_utils import es_correo_valido, es_telefono_valido # Asumiendo que existen
        
        if paso == 3:
             texto = pregunta.strip()
             if not (es_correo_valido(texto) or es_telefono_valido(texto)):
                 return "El dato que me proporcionaste no parece un correo o teléfono válido. Intenta de nuevo."
             datos["contacto"] = texto
             
       
        
        # Fallback por si algo sale mal
        session_state["flujo"] = None
        session_state["paso"] = 0
        return "He tenido un problema siguiendo el flujo de soporte. Vuelve a decirme tu problema."


    # =========================
    # ACCIÓN 3: Preguntar al Chatbot (Lógica de validación CORREGIDA)
    # =========================
    def ask(self, pregunta: str, context_id: str = None) -> str:
        
        # 1. Comprobar si los modelos están disponibles (dispara lazy load)
        if not self.modelo or not self.db:
            print("💥 [ask] Error: El modelo LLM o la Base de Datos no están disponibles.")
            return "Lo siento, estoy teniendo problemas técnicos. Mi base de conocimiento o mi modelo de IA no están disponibles en este momento."

        logging.info(jsonlib.dumps({
            "event": "ask_received",
            "pregunta": pregunta
        }))

        
        # Usamos normalizar_texto para limpieza general (acentos, mayúsculas)
        pregunta_norm = normalizar_texto(pregunta)
        pregunta_para_detector = limpiar_para_langdetect(pregunta)

        # --- CACHÉ DE RESPUESTAS ---
        if pregunta_norm in self.cache_respuestas:
            print(" <i> -> [ask] Respondiendo desde caché.")
            return self.cache_respuestas[pregunta_norm]



        # --- VALIDACIONES (NUEVA LÓGICA) ---
        
        # Prueba 1: Entrada Vacía
        if not pregunta_norm:
            logging.warning(jsonlib.dumps({
                "event": "entrada_vacia"
            }))

            return "No recibí ninguna pregunta. ¿Puedes intentarlo de nuevo?"
            
        # Prueba 2: Chitchat (Ahora más flexible)
        respuesta_chitchat = handle_chitchat_advanced(pregunta_norm)
        if respuesta_chitchat:
            print(f" <i> -> [ask]  Detectado chitchat. Respondiendo amigablemente.")
            self.historial.add_message(HumanMessage(content=pregunta))
            self.historial.add_message(AIMessage(content=respuesta_chitchat))
            return respuesta_chitchat
        
        # Prueba 2B: Resumen
        if contiene_palabra_de(RESUMEN_KEYWORDS, pregunta_norm):
            respuesta_resumen = self._resumir_ultima_respuesta()
            self.historial.add_message(HumanMessage(content=pregunta))
            self.historial.add_message(AIMessage(content=respuesta_resumen))
            return respuesta_resumen
            
        # --- Prueba 3: Emojis / Galimatías ---
        if not pregunta_para_detector:
            return "No entendí tu consulta. ¿Puedes reformularla?"

        num_palabras_limpias = len(pregunta_para_detector.split())

        # --- DETECCIÓN DE IDIOMA CON CACHÉ ---
        try:
            if pregunta_para_detector in self.cache_idioma:
                lang = self.cache_idioma[pregunta_para_detector]
            else:
                lang = detect(pregunta_para_detector)
                self.cache_idioma[pregunta_para_detector] = lang
        except LangDetectException:
            return "No entendí tu consulta, parece incoherente. ¿Puedes reformularla?"

        # --- Reglas de idioma ---
        if num_palabras_limpias >= 3 and lang != 'es':
            # tolerancia para palabras mal escritas
            tokens = pregunta_para_detector.split()
            tokens_espanol = sum(1 for t in tokens if re.match(r"[a-záéíóúñü]+$", t))

            if tokens_espanol / len(tokens) < 0.5:
                return "Lo siento, solo puedo responder en español."

        # Prueba 4: Un solo término ambiguo (SIN CAMBIOS)
        if (num_palabras_limpias == 1 and 
            pregunta_norm not in PALABRAS_SEGURAS_DE_UNA_SOLA_PALABRA and
            not contiene_palabra_de(SALUDOS_KEYWORDS, pregunta_norm)): # Excepción extra
            print(" <i> -> [ask] ⚠️ Pregunta demasiado ambigua (1 palabra). Pidiendo contexto.")
            return "Tu consulta es muy breve. ¿Podrías proporcionarme más contexto o detalles?"
        # --- FIN DE VALIDACIONES ---
        
        print(f" <i> -> Contexto de Anuncio ID: {context_id}")
        
        # Obtiene estado de la sesión DESDE self.sesiones_estado
        session_id = self._get_session_id(context_id)
        session_state = self._get_session_state(session_id)

        
        # --- Historial y Re-escritura (SIN CAMBIOS) ---
        historial_texto = "\n".join(
            f"Usuario: {m.content}" if isinstance(m, HumanMessage) else f"Asistente: {m.content}"
            for m in self.historial.messages
        )
        pregunta_para_busqueda = pregunta
        es_seguimiento = False 
        # Solo reescribir la pregunta si ya hubo varias interacciones
        if self.historial.messages and len(self.historial.messages) >= 4:
            print(" <i> -> [ask] Hay historial, re-escribiendo la pregunta...")
            REWRITE_PROMPT_TEMPLATE = """
Basado en el "Historial de chat", analiza la "Pregunta Actual".
Decide si es un "SEGUIMIENTO" o un "TEMA_NUEVO".
Re-escribe la "Pregunta Actual" para que sea una consulta independiente.
Responde ÚNICAMENTE con un objeto JSON con "tipo" y "pregunta_reescrita".

Historial de chat:
{chat_history}

Pregunta Actual:
{question}

Tu respuesta JSON:
"""
            try:
                rewrite_prompt = ChatPromptTemplate.from_template(REWRITE_PROMPT_TEMPLATE).format(
                    chat_history=historial_texto, question=pregunta
                )
                respuesta_llm = self.modelo.invoke([HumanMessage(content=rewrite_prompt)])
                json_string = respuesta_llm.content.strip().replace("```json\n", "").replace("\n```", "")
                info_pregunta = json.loads(json_string)
                pregunta_para_busqueda = info_pregunta.get("pregunta_reescrita", pregunta)
                if info_pregunta.get("tipo", "TEMA_NUEVO") == "SEGUIMIENTO":
                    es_seguimiento = True
                print(f" <i> -> [ask] Pregunta re-escrita: {pregunta_para_busqueda}")
            except Exception as e:
                print(f"💥 [ask] Error al re-escribir (se usará la pregunta original): {e}")
                pregunta_para_busqueda = pregunta
                es_seguimiento = False
        else:
            print(" <i> -> [ask] No hay historial, se considera TEMA_NUEVO.")

        # --- Lógica de Filtro (SIN CAMBIOS) ---
        search_kwargs = {"k": 4}
        
        if context_id and es_seguimiento:
            posibles_sources = [
                f"anexo_anuncio_{context_id}.pdf",
                f"info_anuncio_{context_id}.pdf",
            ]

            search_kwargs['filter'] = {"source": {"$in": posibles_sources}}

            print(f" <i> -> BÚSQUEDA FILTRADA (es seguimiento) por: {posibles_sources}")
        else:
            print(f" <i> -> BÚSQUEDA GENERAL (es tema nuevo o no hay contexto)")

            
        try:
            documentos_relacionados = self.db.similarity_search_with_score(
                pregunta_para_busqueda, 
                **search_kwargs
            )
            contexto = "\n\n---\n\n".join([doc.page_content for doc, _ in documentos_relacionados])
            # Limitar tamaño del contexto para que el prompt no sea gigante
            MAX_CONTEXT_CHARS = 4000  # puedes ajustar este valor
            if len(contexto) > MAX_CONTEXT_CHARS:
                contexto = contexto[:MAX_CONTEXT_CHARS]
            # --- FECHAS DETECTADAS ---
            fechas_detectadas = self._extraer_fechas(contexto)
            clasificacion_fechas = self._clasificar_fechas(fechas_detectadas)

            tabla_fechas = "\n".join(
                f"- {fecha}: {estado}"
                for fecha, estado in clasificacion_fechas
            )

            logging.info(jsonlib.dumps({
                "event": "rag_results",
                "cantidad": len(documentos_relacionados)
            }))

            
            if not contexto.strip():
                print(" <i> -> [ask] ⚠️ No se encontró contexto en la BD.")
                # Aquí es donde "mbbsxaj" e "inscripcion" (si no está en el PDF) morirán
                respuesta = "Lo siento, no pude encontrar información sobre eso en mis documentos."
                self.historial.add_message(HumanMessage(content=pregunta))
                self.historial.add_message(AIMessage(content=respuesta))
                return respuesta

        except Exception as e:
            print(f"💥 [ask] Error en similarity_search: {e}")
            contexto = ""
            respuesta = "Lo siento, tuve un error al buscar en mi base de conocimiento."
            self.historial.add_message(HumanMessage(content=pregunta))
            self.historial.add_message(AIMessage(content=respuesta))
            return respuesta

        # --- OBTENER FECHA Y CREAR PROMPT FINAL (SIN CAMBIOS) ---
        hoy = datetime.now().strftime("%Y-%m-%d") 

        PLANTILLA_PROMPT = """
        ¡Instrucción Absoluta! Eres PoliChat.
        Tu tarea principal es responder la "Pregunta actual" usando el "Contexto disponible".

        **REGLA MÁS IMPORTANTE:** La fecha de hoy es **{fecha_actual}**.

        **Fechas detectadas en el contexto y su clasificación:**  
        {tabla_fechas}

        * Si una fecha está clasificada como PASADO, debes expresarla en pasado.
        * Si está clasificada como FUTURO, debes expresarla en futuro.
        * Si está HOY, debes expresarla como un evento del día presente.

        **Regla de Contexto:**
        * Basa tu respuesta únicamente en el "Contexto disponible".
        * Si la información NO está en el contexto, responde exactamente:
        "Lo siento, no pude encontrar información sobre eso en mis documentos."

        ---
        **Contexto disponible:**
        {context}
        ---
        **Pregunta actual:**
        {question}

        **Respuesta (con tiempos verbales correctos):**
        """

        
        try:
            prompt_template = ChatPromptTemplate.from_template(PLANTILLA_PROMPT)
            prompt = prompt_template.format(
                fecha_actual=hoy,
                context=contexto,
                tabla_fechas=tabla_fechas,
                question=pregunta
            )
            print(f"📝 [ask] Prompt generado (primeros 300 chars): {prompt[:300]}")
        except Exception as e:
            print(f"💥 [ask] Error generando prompt: {e}")
            return "⚠ Error generando prompt"

        # --- LLAMADA AL LLM Y GUARDADO EN HISTORIAL (SIN CAMBIOS) ---
        while True:
            try:
                logging.info(jsonlib.dumps({
                    "event": "lazy_load_embeddings",
                    "status": "ok"
                }))

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

        # --- Guardar respuesta en caché (PASO 5.3) ---
        respuesta_final = respuesta.content.strip()
        self.cache_respuestas[pregunta_norm] = respuesta_final

        return respuesta_final



# =========================
# Instancia Única (Singleton)
# =========================
print("--- Inicializando instancia global del ChatBot ---")
bot_global = ChatBot()
print("--- Instancia global del ChatBot CREADA ---")


# =============================================================
# BLOQUE DE EJECUCIÓN (Para probar en terminal)
# =============================================================
if __name__ == "__main__":
    print("\n" + "="*50)
    print("🤖 PoliChat en Modo Terminal (Prueba Educativa)")
    print("="*50)
    print(f"Usando DB en: {CHROMA_PATH}")
    print("¡Hola! Escribe tu pregunta. Escribe 'salir' para terminar.")
    
    # Simulación de carga de PDF
    print("\nSimulando procesamiento de 'anuncio_123.pdf'...")
    ruta_pdf_prueba = os.path.join(PDFS_DIR, "anexo_anuncio_123.pdf")
    if not os.path.exists(ruta_pdf_prueba):
        try:
            with open(ruta_pdf_prueba, "w") as f:
                f.write("archivo pdf falso")
        except Exception as e:
            print(f"No se pudo crear el PDF falso: {e}")

    bot_global.procesar_pdf(ruta_pdf_prueba)
    print("Simulación de PDF completada. Puedes preguntar por 'pagos'.")

    while True:
        try:
            pregunta = input("\n👤 Usuario: ")
            if not pregunta.strip():
                continue
            if normalizar_texto(pregunta) == "salir":
                print("🤖 PoliChat: ¡Hasta luego!")
                break
            
            respuesta = bot_global.ask(pregunta, context_id="terminal_session")
            print(f"🤖 PoliChat: {respuesta}")

        except KeyboardInterrupt:
            print("\n🤖 PoliChat: ¡Hasta luego! (Interrupción detectada)")
            break
        except Exception as e:
            print(f"\n💥 ERROR INESPERADO: {e}")
            break