import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { useDisclosure } from "hooks";
//import { toast } from "sonner";
import PropTypes from "prop-types";
import { ReDeleteAnnouncementModal } from "./ReDeleteAnnouncementModal";

export function DeleteAnnouncementModal({ anuncioId, anuncioTitle, onDeleted, openExternally = true }) {
  const [isOpen, { close }] = useDisclosure(openExternally);
  const [showSecondModal, setShowSecondModal] = useState(false);

  const state = "pending";

  const messages = {
    pending: {
      Icon: ExclamationTriangleIcon,
      title: "¿Estás seguro?",
      description: `Se eliminará el anuncio "${anuncioTitle}".`,
      actionText: "Continuar",
    },
  };

  const onOk = () => {
    close(); // Cierra el primer modal
    setTimeout(() => setShowSecondModal(true), 200); // Abre el segundo modal
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
        <ReDeleteAnnouncementModal
          anuncioId={anuncioId}
          anuncioTitle={anuncioTitle}
          onDeleted={() => {
            setShowSecondModal(false);
            //toast.success("El anuncio fue eliminado correctamente✅");
            onDeleted?.();
          }}
        />
      )}
    </>
  );
}

DeleteAnnouncementModal.propTypes = {
  anuncioId: PropTypes.number.isRequired,
  anuncioTitle: PropTypes.string.isRequired,
  onDeleted: PropTypes.func,
  openExternally: PropTypes.bool,
};
