import { useState } from "react";
import { ChatProvider } from "./ChatProvider";
import { Conversation } from "./Conversation";
import { Footer } from "./Footer";
import { ChatBubbleLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 🔘 Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-60 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        {isOpen ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftIcon className="h-6 w-6" />}
      </button>

      {/* 💬 Ventana del chat con animación */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed bottom-20 right-4 z-[9999] flex h-[80vh] w-[90vw] max-w-md flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl dark:border-dark-600 dark:bg-dark-800"
          >
            <ChatProvider>
              {/* 📜 Área de conversación (sin overflow aquí) */}
              <div className="flex-1 min-h-0">
                <Conversation />
              </div>

              {/* ✍️ Input fijo al fondo */}
              <div className="shrink-0 border-t border-gray-200 dark:border-dark-600">
                <Footer />
              </div>
            </ChatProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
