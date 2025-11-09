import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
import axios from "utils/axios";
import { toast } from "sonner";

export function DeleteAnnouncementModal({ anuncioId, anuncioTitle, onDeleted, openExternally = true }) {
  const [isOpen, { close }] = useDisclosure(openExternally);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const state = error ? "error" : success ? "success" : "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: "¿Estás seguro?",
      description: `Se eliminará el anuncio "${anuncioTitle}". Esta acción no se puede deshacer.`,
      actionText: "Eliminar",
    },
    success: {
      title: "Anuncio eliminado",
      description: `El anuncio "${anuncioTitle}" fue eliminado correctamente.`,
    },
    error: {
      description: "Ocurrió un error. Intenta nuevamente.",
    },
  };

  const onOk = async () => {
    setLoading(true);
    try {
      await axios.delete(`/anuncios/${anuncioId}/`); // Llamamos al endpoint de eliminación de anuncio
      setLoading(false);
      setSuccess(true);
      setError(false);
      toast.success(`Anuncio "${anuncioTitle}" eliminado ✅`);
      onDeleted?.(); // Callback para actualizar la lista de anuncios
    } catch (err) {
      setLoading(false);
      setError(true);
      toast.error(`Error al eliminar el anuncio ❌`, err);
    }
  };

  return (
    <ConfirmModal
      show={isOpen}
      onClose={close}
      messages={messages}
      onOk={onOk}
      confirmLoading={loading}
      state={state}
    />
  );
}
