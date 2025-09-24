import { useEffect, useRef, useState } from "react";
import { ScrollShadow } from "components/ui";
import { Message } from "./Message";
import { useChatContext } from "../Chat.context";
import { Placeholder } from "./Placeholder";

export function Conversation() {
  const { currentChat, isLoading } = useChatContext();
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Detecta si el usuario está al fondo (tolerancia 50px)
  const recomputeIsAtBottom = () => {
    const el = panelRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setIsAtBottom(atBottom);
  };

  // Scroll solo dentro del contenedor del chat
  const scrollToBottom = (smooth = true) => {
    const el = panelRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // Listener de scroll del usuario
  const handleScroll = () => {
    recomputeIsAtBottom();
  };

  // Autoscroll cuando cambian mensajes o estado de carga,
  // pero solo si el usuario está al fondo
  useEffect(() => {
    if (isAtBottom) scrollToBottom(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat?.messages?.length, isLoading]);

  // Autoscroll cuando cambia de chat (solo si ya hay mensajes)
  useEffect(() => {
    if (currentChat?.messages && currentChat.messages.length > 0) {
      scrollToBottom(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat?.id]);

  // Reaccionar a resize de ventana
  useEffect(() => {
    const onResize = () => {
      if (isAtBottom) scrollToBottom(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAtBottom]);

  // Reaccionar a cambios de tamaño del contenido
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(() => {
      if (isAtBottom) scrollToBottom(false);
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAtBottom, currentChat?.id]);

  // Si no hay mensajes, muestra placeholder
  if (!(currentChat && currentChat.messages.length > 0)) {
    return (
      <ScrollShadow
        data-conversation-panel
        ref={panelRef}
        className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto"
      >
        <Placeholder />
      </ScrollShadow>
    );
  }

  return (
    <ScrollShadow
      ref={panelRef}
      onScroll={handleScroll}
      data-conversation-panel
      className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto px-4 py-4"
    >
      <div ref={contentRef} className="flex flex-col space-y-8">
        {currentChat.messages.map((message) => (
          <Message key={message.id} role={message.role} content={message.content} />
        ))}
      </div>
    </ScrollShadow>
  );
}
