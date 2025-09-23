// Import Dependencies
import PropTypes from "prop-types";
import { useState } from "react";

// Local Imports
import { ChatContextProvider } from "./Chat.context";
import { randomId } from "utils/randomId";

// ----------------------------------------------------------------------

export function ChatProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentChat = chats.find((chat) => chat.id === activeChatId);

  // ✅ newMessage: siempre devuelve el chatId usado
  const newMessage = (chatId, data) => {
    const now = new Date();
    const msg = {
      id: randomId(),
      role: data.role,
      content: data.content,
      createdAt: now,
    };

    // Generar/usar chatId antes de mutar el estado
    const idToUse = chatId ?? activeChatId ?? randomId();

    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === idToUse);

      if (idx === -1) {
        // Crear chat nuevo con el primer mensaje
        const newChat = {
          id: idToUse,
          messages: [msg],
          createdAt: now,
        };
        return [newChat, ...prev];
      }

      // Agregar mensaje al chat existente (inmutable)
      const updatedChat = {
        ...prev[idx],
        messages: [...prev[idx].messages, msg],
      };
      const arr = prev.slice();
      arr.splice(idx, 1);
      return [updatedChat, ...arr];
    });

    setActiveChatId(idToUse);
    return idToUse; // 👈 devolvemos el id efectivo
  };

  const value = {
    chats,
    currentChat,
    newMessage,
    setActiveChatId,
    isLoading,
    setIsLoading,
  };

  return <ChatContextProvider value={value}>{children}</ChatContextProvider>;
}

ChatProvider.propTypes = {
  children: PropTypes.node,
};
