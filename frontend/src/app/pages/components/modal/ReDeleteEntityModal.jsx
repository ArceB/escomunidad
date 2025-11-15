import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";

export function ReDeleteEntityModal({ entidadId, entidadNombre, onDeleted, openExternally = true }) {
  const [isOpen, { close }] = useDisclosure(openExternally);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const state = error ? "error" : success ? "success" : "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: "Confirmar eliminación definitiva",
      description: `Esta acción eliminará permanentemente la entidad "${entidadNombre}" y todos sus anuncios asociados. ¿Deseas continuar?`,
      actionText: "Eliminar definitivamente",
    },
    success: {
      title: "Entidad eliminada",
      description: `La entidad "${entidadNombre}" fue eliminada correctamente.`,
    },
    error: {
      description: "Ocurrió un error. Intenta nuevamente.",
    },
  };

  const onOk = async () => {
    setLoading(true);
    try {
      await axios.delete(`/entidades/${entidadId}/`);
      setLoading(false);
      setSuccess(true);
      setError(false);
      toast.success(`Entidad "${entidadNombre}" eliminada ✅`);
      onDeleted?.();
    } catch (err) {
      setLoading(false);
      setError(true);
      toast.error(`Error al eliminar la entidad ❌`);
      console.error("Error al eliminar:", err);
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

ReDeleteEntityModal.propTypes = {
  entidadId: PropTypes.number.isRequired,
  entidadNombre: PropTypes.string.isRequired,
  onDeleted: PropTypes.func,
  openExternally: PropTypes.bool,
};
