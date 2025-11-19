import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button, Card } from "components/ui";
import { useChatContext } from "../Chat.context";

const defaultMessages = [
  { id: "1", content: "¿Cuáles son las becas disponibles?" },
  { id: "2", content: "¿Cuáles son los requisitos para reinscribirme?" },
  { id: "3", content: "Dame información sobre la ESCOM" },
  { id: "4", content: "Dame información sobre el servicio social" },
];

export function Placeholder() {
  const { newMessage, currentChat, isLoading, setIsLoading } = useChatContext();

  const handleClick = async (messageContent) => {
    if (isLoading) return;
    setIsLoading(true);

    const chatId = newMessage(currentChat?.id, {
      role: "user",
      content: messageContent,
    });

    try {
      console.log("➡️ Mandando a backend (placeholder):", messageContent);

      const response = await fetch("http://127.0.0.1:8000/chatbot/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      console.log("📦 JSON recibido (placeholder):", data);

      newMessage(chatId, {
        role: "assistant",
        content: data.reply ?? "⚠ El servidor no devolvió respuesta",
      });
    } catch (err) {
      console.error("💥 Error en el fetch (placeholder):", err);
      newMessage(chatId, {
        role: "assistant",
        content: "⚠ No se pudo conectar con el servidor.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl grow flex-col justify-center pb-3 pt-10">
      <div className="px-4 text-[clamp(2.2rem,3.75vw,3.75rem)] font-medium leading-[1.1] tracking-tight">
        <span
          style={{
            animationDuration: "5s",
            backgroundSize: "200% 100%",
          }}
          className="block animate-shimmer bg-linear-to-r from-blue-900 via-blue-400 to-rose-950 bg-clip-text font-semibold text-transparent"
        >
          ¡Bienvenido!

        </span>
        <span className="block text-gray-400 dark:text-dark-300">
          ¿Con qué te puedo ayudar?
        </span>
      </div>

      {/* ✅ Grid limpio sin scrolls raros */}
      <div className="mt-12 grid w-full gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {defaultMessages.map((message) => (
          <Card
            onClick={() => handleClick(message.content)}
            key={message.id}
            className={clsx(
              "group flex flex-col p-3 transition-transform hover:scale-[1.02] cursor-pointer",
              isLoading && "opacity-50 pointer-events-none"
            )}
          >
            <div className="grow">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {message.content}
              </h3>
            </div>
            <div className="flex justify-end pt-6">
              <Button component="div" isIcon className="size-8 rounded-full">
                <ArrowUpRightIcon className="size-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
