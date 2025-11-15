import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
import PropTypes from "prop-types";
import { ReDeleteEntityModal } from "./ReDeleteEntityModal";
//import { toast } from "sonner";

export function DeleteEntityModal({ entidadId, entidadNombre, onDeleted, openExternally = true }) {
  const [isOpen, { close }] = useDisclosure(openExternally);
  const [showSecondModal, setShowSecondModal] = useState(false);

  const state = "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: "¿Estás seguro?",
      description: `Se eliminará la entidad "${entidadNombre}" y todos sus anuncios relacionados.`,
      actionText: "Continuar",
    },
  };

  const onOk = () => {
    close();
    setTimeout(() => setShowSecondModal(true), 200);
  };

  return (
    <>
      <ConfirmModal
        show={isOpen}
        onClose={close}
        messages={messages}
        onOk={onOk}
        state={state}
      />

      {showSecondModal && (
        <ReDeleteEntityModal
          entidadId={entidadId}
          entidadNombre={entidadNombre}
          onDeleted={() => {
            setShowSecondModal(false);
            //toast.success("La entidad fue eliminada correctamente");
            onDeleted?.();
          }}
        />
      )}
    </>
  );
}

DeleteEntityModal.propTypes = {
  entidadId: PropTypes.number.isRequired,
  entidadNombre: PropTypes.string.isRequired,
  onDeleted: PropTypes.func,
  openExternally: PropTypes.bool,
};
  