// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";
import { toast } from "sonner";
import { useCallback, useState } from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";

// Local Imports
import { Badge, Button, Card } from "components/ui";
import { rolesOptions } from "./data";
import { StyledSwitch } from "components/shared/form/StyledSwitch";
import { ConfirmModal } from "components/shared/ConfirmModal";

// ----------------------------------------------------------------------

export function GridView({ table, rows }) {
  const enableFullScreen = table.getState().tableSettings.enableFullScreen;

  return (
    <div
      className={clsx(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4",
        enableFullScreen && "overflow-y-auto px-4 sm:px-5"
      )}
    >
      {rows.map((row) => (
        <Item key={row.id} row={row} table={table} />
      ))}
    </div>
  );
}

function Item({ row, table }) {
  const [loading, setLoading] = useState(false);

  const option = rolesOptions.find((item) => item.value === row.original.role);
  //const canSelect = row.getCanSelect();

  const onChange = async (checked) => {
    setLoading(true);
    setTimeout(() => {
      table.options.meta?.updateData(row.index, "status", checked);
      toast.success("Estado de usuario actualizado");
      setLoading(false);
    }, 1000);
  };

  const fullName = `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim();
  const email = row.original.email || "Sin correo";
  const roleLabel = option ? option.label : row.original.role || "Sin rol";
  const roleColor = option ? option.color : "gray";

  return (
    <Card
      className={clsx(
        "px-3 py-3 text-center",
        row.getIsSelected() && "ring-3 ring-primary-500/50"
      )}
    >
      <div className="flex w-full items-center justify-between pb-5">
        <Badge color={roleColor} variant="outlined">
          {roleLabel}
        </Badge>
        <StyledSwitch
          checked={row.original.status}
          onChange={onChange}
          loading={loading}
        />
      </div>

      <h3 className="mt-2 text-base font-medium text-gray-800 dark:text-dark-100">
        {fullName || row.original.username || "Sin nombre"}
      </h3>

      <div className="mx-auto mt-4 inline-grid grid-cols-1 gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-primary-600/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-400">
            <EnvelopeIcon className="size-3.5" />
          </div>
          <p className="truncate">{email}</p>
        </div>

        <Actions row={row} table={table} />
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------

const confirmMessages = {
  pending: {
    description:
      "¿Seguro que deseas eliminar este usuario? Una vez eliminado, no se puede recuperar.",
  },
  success: {
    title: "Usuario eliminado",
  },
};

function Actions({ row, table }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const closeModal = () => setDeleteModalOpen(false);
  const openModal = () => {
    setDeleteModalOpen(true);
    setDeleteError(false);
    setDeleteSuccess(false);
  };

  const handleDeleteRows = useCallback(() => {
    setConfirmDeleteLoading(true);
    setTimeout(() => {
      table.options.meta?.deleteRow(row);
      setDeleteSuccess(true);
      setConfirmDeleteLoading(false);
    }, 1000);
  }, [row, table]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  return (
    <>
      <div className="flex justify-center gap-1 py-2">
        
        <Menu as="div" className="relative inline-block text-left">
          <MenuButton as={Button} isIcon className="size-7 rounded-full">
            <EllipsisHorizontalIcon className="size-4" />
          </MenuButton>
          <Transition
            as={MenuItems}
            enter="transition ease-out"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
            className="absolute z-100 mt-1.5 min-w-[10rem] rounded-lg border border-gray-300 bg-white py-1 shadow-lg shadow-gray-200/50 outline-hidden focus-visible:outline-hidden dark:border-dark-500 dark:bg-dark-750 dark:shadow-none ltr:right-0 rtl:left-0"
          >
            <MenuItem>
              {({ focus }) => (
                <button
                  className={clsx(
                    "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                    focus &&
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100"
                  )}
                >
                  <EyeIcon className="size-4.5 stroke-1" />
                  <span>Ver</span>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  className={clsx(
                    "flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                    focus &&
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100"
                  )}
                >
                  <PencilIcon className="size-4.5 stroke-1" />
                  <span>Editar</span>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={openModal}
                  className={clsx(
                    "text-red-600 dark:text-red-400 flex h-9 w-full items-center gap-3 px-3 tracking-wide outline-hidden transition-colors",
                    focus && "bg-red-50 dark:bg-red-900/20"
                  )}
                >
                  <TrashIcon className="size-4.5 stroke-1" />
                  <span>Eliminar</span>
                </button>
              )}
            </MenuItem>
          </Transition>
        </Menu>
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDeleteRows}
        confirmLoading={confirmDeleteLoading}
        state={state}
      />
    </>
  );
}

// ----------------------------------------------------------------------

GridView.propTypes = {
  table: PropTypes.object,
  rows: PropTypes.array,
};

Item.propTypes = {
  table: PropTypes.object,
  row: PropTypes.object,
};

Actions.propTypes = {
  table: PropTypes.object,
  row: PropTypes.object,
};
