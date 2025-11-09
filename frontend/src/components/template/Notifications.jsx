// Import Dependencies
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import PropTypes from "prop-types";
import {
  ArchiveBoxXMarkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router";
import { useEffect } from "react";
import axios from "utils/axios";

// Local Imports
import { AvatarDot, Badge, Button } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import AlarmIcon from "assets/dualicons/alarm.svg?react";
import GirlEmptyBox from "assets/illustrations/girl-empty-box.svg?react";

// ----------------------------------------------------------------------


export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) return;

        const { data } = await axios.get("/notificaciones/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 🔹 Ajustar formato a lo que necesitamos en el front
        const formatted = data.map((n) => ({
          id: n.id,
          mensaje: n.mensaje,
          fecha: n.fecha,
          visto: n.visto,
          anuncio: n.anuncio || null,
          banner: n.banner || n.anuncio?.banner || null,
        }));

        setNotifications(formatted);
      } catch (error) {
        console.error("❌ Error al cargar notificaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);


  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <Popover className="relative flex">
      <PopoverButton
        as={Button}
        variant="flat"
        isIcon
        className="relative size-9 rounded-full"
      >
        <AlarmIcon className="size-6 text-gray-900 dark:text-dark-100" />
        {notifications.length > 0 && (
          <AvatarDot
            color="error"
            isPing
            className="top-0 ltr:right-0 rtl:left-0"
          />
        )}
      </PopoverButton>
      <Transition
        enter="transition ease-out"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
      >
        <PopoverPanel
          anchor={{ to: "bottom end", gap: 8 }}
          className="z-70 mx-4 flex h-[min(32rem,calc(100vh-6rem))] w-[calc(100vw-2rem)] flex-col rounded-lg border border-gray-150 bg-white shadow-soft dark:border-dark-800 dark:bg-dark-700 dark:shadow-soft-dark sm:m-0 sm:w-80"
        >
          {({ close }) => (
            <div className="flex grow flex-col overflow-hidden">
              <div className="rounded-t-lg bg-gray-100 dark:bg-dark-800">
                <div className="flex items-center justify-between px-4 pt-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800 dark:text-dark-100">
                      Notificaciones
                    </h3>
                    {!loading && notifications.length > 0 && (
                      <Badge
                        color="primary"
                        className="h-5 rounded-full px-1.5"
                        variant="soft"
                      >
                        {notifications.length > 99 ? "99+" : notifications.length}
                      </Badge>
                    )}

                  </div>
                  <Button
                    component={Link}
                    to="/settings/notifications"
                    className="size-7 rounded-full ltr:-mr-1.5 rtl:-ml-1.5"
                    isIcon
                    variant="flat"
                    onClick={close}
                  >
                    <Cog6ToothIcon className="size-4.5" />
                  </Button>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-500 dark:text-dark-300">
                  Cargando notificaciones...
                </div>
              ) : notifications.length > 0 ? (
                <div className="custom-scrollbar grow space-y-4 overflow-y-auto overflow-x-hidden p-4">
                  {notifications.map((item) => (
                    <NotificationItem
                      key={item.id}
                      remove={(id) => setNotifications((n) => n.filter((x) => x.id !== id))}
                      data={item}
                    />
                  ))}
                </div>
              ) : (
                <Empty />
              )}

              {notifications.length > 0 && (
                <div className="shrink-0 overflow-hidden rounded-b-lg bg-gray-100 dark:bg-dark-800">
                  <Button
                    // variant="flat"
                    className="w-full rounded-t-none"
                    onClick={clearNotifications}
                  >
                    <span>Archive all notifications</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </PopoverPanel>
      </Transition>
    </Popover>
  );
}

function Empty() {
  const { primaryColorScheme: primary, darkColorScheme: dark } =
    useThemeContext();
  return (
    <div className="grid grow place-items-center text-center">
      <div className="">
        <GirlEmptyBox
          className="mx-auto w-40"
          style={{ "--primary": primary[500], "--dark": dark[500] }}
        />
        <div className="mt-6">
          <p>Aún no hay notificaciones nuevas</p>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({ data, remove }) {
  const bannerUrl = data.banner;
  const fecha = data.fecha ? new Date(data.fecha).toLocaleString() : "—";

  return (
    <div
      onClick={() => {
        if (data.anuncio?.id) {
          window.location.href = `/administracion/anuncios/${data.anuncio.id}`;
        }
      }}
      className="group flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600 p-2 rounded-md transition"
    >
      <div className="flex min-w-0 gap-3 items-center">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Banner anuncio"
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
            📰
          </div>
        )}

        <div className="min-w-0">
          <p className="whitespace-normal break-words font-medium text-gray-800 dark:text-dark-100">
            {data.mensaje}
          </p>
          <p className="text-xs text-gray-400 dark:text-dark-300 mt-1">
            {fecha}
          </p>
        </div>
      </div>

      <Button
        variant="flat"
        isIcon
        onClick={(e) => {
          e.stopPropagation(); // 🔹 evita que el click en el botón navegue
          remove(data.id);
        }}
        className="size-7 rounded-full opacity-0 group-hover:opacity-100 ltr:-mr-2 rtl:-ml-2"
      >
        <ArchiveBoxXMarkIcon className="size-4" />
      </Button>
    </div>
  );
}

NotificationItem.propTypes = {
  data: PropTypes.object,
  remove: PropTypes.func,
};
