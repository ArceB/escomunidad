import re
import requests
from django.conf import settings
from django.http import HttpResponse


class PrerenderMiddleware:
    """
    Middleware para servir contenido prerenderizado a bots de redes sociales.
    Compatible con Facebook, LinkedIn, Twitter, Google, etc.
    """

    CRAWLER_USER_AGENTS = re.compile(
        r"googlebot|bingbot|yandex|baiduspider|facebookexternalhit|linkedinbot|twitterbot|slackbot",
        re.I,
    )

    def __init__(self, get_response):
        self.get_response = get_response
        self.prerender_url = getattr(settings, "PRERENDER_URL", "https://service.prerender.io/")
        self.prerender_token = getattr(settings, "PRERENDER_TOKEN", None)

    def __call__(self, request):
        # Detectar si el request proviene de un bot
        user_agent = request.META.get("HTTP_USER_AGENT", "").lower()
        if self.CRAWLER_USER_AGENTS.search(user_agent):
            prerendered_response = self.get_prerendered_response(request)
            if prerendered_response:
                return prerendered_response

        # De lo contrario, continuar normalmente
        response = self.get_response(request)
        return response

    def get_prerendered_response(self, request):
        url = request.build_absolute_uri()
        headers = {"User-Agent": "Prerender-Django"}
        if self.prerender_token:
            headers["X-Prerender-Token"] = self.prerender_token

        try:
            prerendered_url = f"{self.prerender_url}{url}"
            prerendered_response = requests.get(prerendered_url, headers=headers)
            if prerendered_response.status_code == 200:
                return HttpResponse(prerendered_response.content)
        except Exception as e:
            print(f"[Prerender] Error fetching {url}: {e}")
        return None
