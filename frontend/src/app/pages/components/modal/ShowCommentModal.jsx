// Import Dependencies
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import PropTypes from "prop-types";
import { MessageSquareTextIcon } from "lucide-react"; // ícono para el modal
import clsx from "clsx";
import { Button } from "components/ui";
import { useRef } from "react";

// ----------------------------------------------------------------------

export function ShowCommentModal({ show, onClose, comentario }) {
  const focusRef = useRef();

  return (
    <Transition
      appear
      show={show}
      as={Dialog}
      initialFocus={focusRef}
      onClose={onClose}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
    >
      {/* Fondo oscurecido */}
      <TransitionChild
        as="div"
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
      />

      {/* Panel del modal */}
      <TransitionChild
        as={DialogPanel}
        enter="ease-out duration-300"
        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        enterTo="opacity-100 translate-y-0 sm:scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        className={clsx(
          "scrollbar-sm relative flex w-full max-w-md flex-col overflow-y-auto rounded-lg bg-white px-5 py-6 text-center shadow-lg transition-all duration-300 dark:bg-dark-700"
        )}
      >
        {/* Ícono superior */}
        <MessageSquareTextIcon className="mx-auto size-16 text-blue-600 dark:text-blue-400" />

        {/* Contenido */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
            Comentario del rechazo
          </h3>
          <p className="mt-3 text-gray-600 dark:text-dark-200 whitespace-pre-wrap">
            {comentario
              ? comentario
              : "No se especificó el motivo del rechazo."}
          </p>
        </div>

        {/* Botón de cierre */}
        <div className="mt-8 flex justify-center">
          <Button
            ref={focusRef}
            color="primary"
            className="h-9 min-w-[7rem]"
            onClick={(e) => {
              e.stopPropagation(); 
              onClose();
            }}
          >
            Cerrar
          </Button>
        </div>
      </TransitionChild>
    </Transition>
  );
}

// ----------------------------------------------------------------------

ShowCommentModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  comentario: PropTypes.string,
};
