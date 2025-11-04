import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { Button, Textarea } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";

export function RejectAnnouncementModal({ anuncioId, onClose, onRejected }) {
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const focusRef = useRef(null);

  const handleReject = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("authToken");
      await axios.post(
        `anuncios/${anuncioId}/revisar/`,
        { accion: "rechazar", comentario },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Anuncio rechazado correctamente.");
      onRejected?.();
      onClose();
    } catch (error) {
      console.error("Error al rechazar anuncio:", error);
      toast.error("No se pudo rechazar el anuncio ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition
      appear
      show={true}
      as={Dialog}
      onClose={onClose}
      initialFocus={focusRef}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
    >
      {/* Fondo oscuro con animación */}
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
        className="scrollbar-sm relative flex w-full max-w-md flex-col overflow-y-auto rounded-lg bg-white px-5 py-6 text-center shadow-lg transition-all duration-300 dark:bg-dark-700"
      >
        {/* Ícono superior */}
        <XCircleIcon className="mx-auto size-16 text-error" />

        {/* Título */}
        <DialogTitle className="mt-4 text-lg font-semibold text-gray-800 dark:text-dark-100">
          Rechazar anuncio
        </DialogTitle>

        {/* Descripción */}
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Indica la razón por la que se rechaza este anuncio:
        </p>

        {/* Campo de texto */}
        <Textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={4}
          className="mt-4 text-left"
          placeholder="Escribe tus comentarios..."
        />

        {/* Botones */}
        <div className="mt-8 flex justify-center space-x-3">
          <Button
            ref={focusRef}
            variant="outlined"
            className="h-9 min-w-[7rem]"
            onClick={(e) => {
              e.stopPropagation(); // evita navegación
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            className="h-9 min-w-[7rem]"
            disabled={loading}
            onClick={handleReject}
          >
            {loading ? "Rechazando..." : "Rechazar"}
          </Button>
        </div>
      </TransitionChild>
    </Transition>
  );
}
