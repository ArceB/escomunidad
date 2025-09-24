from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .src.bot import ChatBot

# Instancia global del bot
bot = ChatBot()

@csrf_exempt
def ask_chatbot(request):
    print("📩 Nueva petición:", request.method)

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            print("📦 Payload recibido:", data)

            question = data.get("message", "")
            print("❓ Pregunta:", question)

            reply = bot.ask(question)
            print("🤖 Respuesta generada:", reply)

            return JsonResponse({"reply": reply})
        except Exception as e:
            print("💥 Error en el backend:", e)
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Only POST allowed"}, status=405)

