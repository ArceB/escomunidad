// Import Dependencies
import PropTypes from "prop-types";
import { EditIcon, TrashIcon } from 'lucide-react';
import {
  //Menu,
  //MenuButton,
  //MenuItem,
  //MenuItems,
  Transition,
} from "@headlessui/react";
import { useState } from "react";
import axios from "utils/axios";
//import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import { BookmarkIcon } from "@heroicons/react/24/outline";
//import clsx from "clsx";
import { Fragment } from "react";
import { FaFacebook, FaLinkedin, FaTwitter, FaWhatsapp } from "react-icons/fa";

// Local Imports
import { useHover } from "hooks";
import { Avatar, Button } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { toast } from "sonner";
import { useNavigate } from "react-router";

import { DeleteAnnouncementModal } from "app/pages/components/modal/DeleteAnnouncementModal";

// ----------------------------------------------------------------------

export function PostHeader({ anuncio, onStatusChange, estado }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const anuncioId = anuncio?.id;


  const handleAction = async (action) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/anuncios/${anuncioId}/revisar/`,
        { accion: action }
      );

      if (response.status === 200) {
        // Llamamos a la función onStatusChange para actualizar el estado en el componente padre
        onStatusChange(action);
        // Redirigimos al usuario, o mostramos un mensaje de éxito
        toast.success(`Anuncio ${action === "aprobar" ? "aprobado" : "rechazado"} correctamente.`);
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al procesar la acción.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(anuncio?.titulo || "Mira este anuncio");

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };


  const { isAuthenticated, role } = useAuthContext();
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">

        </div>
        <div className="flex gap-2">
          {isAuthenticated && role === "responsable" && estado === "pendiente" && (
            <div className="flex max-sm:hidden inline-space">
              <Button color="success"
                className="mt-6 w-full space-x-2 "
                onClick={() => handleAction("aprobar")}
                loading={loading}>

                Aceptar
              </Button>
              <Button color="error"
                className="mt-6 w-full space-x-2 "
                onClick={() => handleAction("rechazar")}
                loading={loading}>

                Rechazar
              </Button>
            </div>
          )}
          <div className="flex max-sm:hidden">
            {!isAuthenticated && (
              <div className="flex max-sm:hidden">
                <Button
                  component="a"
                  href="#"
                  isIcon
                  variant="flat"
                  className="size-8 rounded-full"
                >
                  <BookmarkIcon className="size-5" />
                </Button>
                <Button
                  component="a"
                  href="#"
                  isIcon
                  variant="flat"
                  className="size-8 rounded-full"
                  onClick={() => handleShare("twitter")}
                >
                  <FaTwitter className="size-4.5" />
                </Button>
                <Button
                  component="a"
                  href="#"
                  isIcon
                  variant="flat"
                  className="size-8 rounded-full"
                  onClick={() => handleShare("linkedin")}
                >
                  <FaLinkedin className="size-4.5" />
                </Button>
                <Button
                  component="a"
                  href="#"
                  isIcon
                  variant="flat"
                  className="size-8 rounded-full"
                  onClick={() => handleShare("facebook")}
                >
                  <FaFacebook className="size-4.5" />
                </Button>
                <Button
                  component="a"
                  href="#"
                  isIcon
                  variant="flat"
                  className="size-8 rounded-full"
                  onClick={() => handleShare("whatsapp")}
                >
                  <FaWhatsapp className="size-4.5" />
                </Button>
              </div>
            )}
            {(role === "superadmin" || role === "admin" || role === "responsable") && (
              <div className="mt-3 text-end">
                <Button
                  data-tooltip
                  data-tooltip-content="Editar"
                  unstyled
                  className="size-7 rounded-full hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/administracion/entidades/${anuncio.entidad}/anuncios/${anuncio.id}/editar`);
                  }}
                >
                  <EditIcon className="size-4.5 stroke-2 stroke-blue-800" />
                </Button>
                <Button
                  data-tooltip
                  data-tooltip-content="Eliminar"
                  unstyled
                  className="size-7 rounded-full hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                >
                  <TrashIcon className="size-4.5 stroke-2 stroke-blue-800" />
                </Button>
              </div>
            )}
          </div>

          {/** 
          <ActionMenu />*/}
        </div>
      </div>
      {!isAuthenticated && (
        <div className="mt-6 flex items-center gap-3 sm:hidden">
          <div className="flex flex-wrap">
            <Button
              component="a"
              href="#"
              isIcon
              variant="flat"
              className="size-8 rounded-full"
            >
              <BookmarkIcon className="size-5" />
            </Button>
            <Button
              component="a"
              href="#"
              isIcon
              variant="flat"
              className="size-8 rounded-full"
              onClick={() => handleShare("twitter")}
            >
              <FaTwitter className="size-4.5" />
            </Button>
            <Button
              component="a"
              href="#"
              isIcon
              variant="flat"
              className="size-8 rounded-full"
              onClick={() => handleShare("linkedin")}
            >
              <FaLinkedin className="size-4.5" />
            </Button>
            
            <Button
              component="a"
              href="#"
              isIcon
              variant="flat"
              className="size-8 rounded-full"
              onClick={() => handleShare("facebook")}
            >
              <FaFacebook className="size-4.5" />
            </Button>
            <Button
              component="a"
              href="#"
              isIcon
              variant="flat"
              className="size-8 rounded-full"
              onClick={() => handleShare("whatsapp")}
            >
              <FaWhatsapp className="size-4.5" />
            </Button>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <DeleteAnnouncementModal
          anuncioId={anuncio.id}
          anuncioTitle={anuncio.titulo}
          onDeleted={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

function AuthorAvatar({ name, image, username }) {
  const [avatarRef, isHovered] = useHover();

  return (
    <div className="relative" ref={avatarRef}>
      <Avatar
        size={12}
        src={image}
        initialColor="color"
        name={name}
        className="align-middle"
        classNames={{
          display: "mask is-squircle rounded-none",
        }}
      />

      <Transition
        show={isHovered}
        as={Fragment}
        enter="transition ease-out"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in delay-200"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
      >
        <div className="absolute z-100 pt-1.5">
          <div className="flex w-48 flex-col items-center rounded-md border border-gray-300 bg-white p-3 text-center shadow-lg shadow-gray-200/50 dark:border-dark-500 dark:bg-dark-750 dark:shadow-none">
            <Avatar size={16} src={image} name={name} initialColor="auto" />

            <p className="mt-2 font-medium tracking-wide text-gray-800 dark:text-dark-100">
              {name}
            </p>

            <a
              href="##"
              className="text-xs tracking-wide hover:text-primary-600 focus:text-primary-600 dark:hover:text-primary-400 dark:focus:text-primary-400"
            >
              {username}
            </a>

            <div className="mt-4">
              <Button color="primary" className="h-6 rounded-full px-3 text-xs">
                Follow
              </Button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

AuthorAvatar.propTypes = {
  name: PropTypes.string,
  image: PropTypes.string,
  username: PropTypes.string,
};
PostHeader.propTypes = {
  anuncioId: PropTypes.string.isRequired,  // Asegúrate de pasar el anuncioId desde el componente principal
  onStatusChange: PropTypes.func.isRequired, // Función para manejar el cambio de estado
  estado: PropTypes.string.isRequired, // Estado del anuncio
};
