// Import Dependencies
import PropTypes from "prop-types";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MessageSquareIcon } from "lucide-react";
import { Button, ScrollShadow } from "components/ui";
import { useDisclosure } from "hooks";

// ----------------------------------------------------------------------

export default function RechazoDrawer({ comentario, titulo }) {
  const [isOpen, { open, close }] = useDisclosure(false);

  return (
    <>
      {/* 🟠 Pestaña lateral flotante (lado izquierdo ahora) */}
      <Button
        onClick={open}
        color="warning"
        isIcon
        className="fixed top-1/2 z-50 size-9 rounded-full rtl:right-0 rtl:rounded-r-none ltr:left-0 ltr:rounded-l-none shadow-md"
      >
        <MessageSquareIcon className="size-6 text-white" />
      </Button>

      {/* 🟡 Drawer lateral izquierdo */}
      <Transition show={isOpen}>
        <Dialog open={true} onClose={close} static autoFocus>
          {/* Fondo oscuro */}
          <TransitionChild
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className="fixed inset-0 z-60 bg-gray-900/50 transition-opacity dark:bg-black/40"
          />

          {/* Panel lateral */}
          <TransitionChild
            as={DialogPanel}
            enter="ease-out transform-gpu transition-transform duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in transform-gpu transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
            className="fixed inset-y-0 left-0 z-61 flex w-screen transform-gpu flex-col bg-white transition-transform duration-200 dark:bg-dark-750/80 backdrop-blur-sm sm:inset-y-2 sm:mx-2 sm:w-96 sm:rounded-xl"
          >
            <DrawerContent close={close} comentario={comentario} titulo={titulo} />
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
}

function DrawerContent({ close, comentario, titulo }) {
  return (
    <>
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-dark-600">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-5 text-amber-500" />
          <span className="font-medium text-gray-800 dark:text-dark-100">
            Comentario de rechazo
          </span>
        </div>
        <Button
          onClick={close}
          variant="flat"
          isIcon
          className="size-7 rounded-full ltr:-ml-1 rtl:-mr-1"
        >
          <XMarkIcon className="size-5" />
        </Button>
      </div>

      {/* Contenido desplazable */}
      <ScrollShadow
        size={4}
        className="custom-scrollbar h-auto overflow-y-auto overscroll-contain px-4 pb-6 pt-3"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-100">
              {titulo}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Este anuncio fue rechazado. Revisa los comentarios del responsable
              antes de realizar cambios y volver a enviarlo.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-dark-600 dark:bg-dark-800">
            <p className="text-sm leading-relaxed text-gray-700 dark:text-dark-200 whitespace-pre-wrap">
              {comentario || "Sin comentarios."}
            </p>
          </div>
        </div>
      </ScrollShadow>
    </>
  );
}

DrawerContent.propTypes = {
  close: PropTypes.func,
  comentario: PropTypes.string,
  titulo: PropTypes.string,
};
