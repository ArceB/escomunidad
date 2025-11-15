// app/pages/components/modal/ApproveAnnouncementModal.jsx

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import PropTypes from "prop-types";
import { Button } from "components/ui";

export function ApproveAnnouncementModal({ isOpen, onClose, onConfirm }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
        onClose={onClose}
      >
        {/* Fondo oscuro */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40" />
        </TransitionChild>

        {/* Panel del modal */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <DialogPanel className="relative max-w-md w-full rounded-lg bg-white px-6 py-8 text-center shadow-xl dark:bg-dark-700 transition-all">
            <CheckCircleIcon className="mx-auto size-20 text-success" />

            <DialogTitle
              as="h3"
              className="mt-4 text-2xl font-semibold text-gray-800 dark:text-dark-100"
            >
              ¿Hacer público el anuncio?
            </DialogTitle>

            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Una vez confirmado, el anuncio será visible públicamente para todos los usuarios.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Button color="success" onClick={onConfirm}>
                Publicar
              </Button>
              <Button color="error" variant="soft" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

ApproveAnnouncementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
