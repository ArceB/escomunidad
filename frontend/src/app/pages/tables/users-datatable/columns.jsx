// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
/*import { CopyableCell } from "components/shared/table/CopyableCell";
import { NameCell, RoleCell, StatusCell } from "./rows";
import { RowActions } from "./RowActions";
import { HighlightableCell } from "components/shared/table/HighlightableCell";*/
import { NameCell, RoleCell, LastNameCell, StatusCell } from "./rows";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();


export const columns = [
  columnHelper.accessor("is_active", {
    id: "is_active",
    header: "Estado",
    cell: StatusCell,
    // Agregamos la propiedad 'userId' que corresponde al ID del usuario
    // que se pasa a la celda para actualizar el estado correctamente.
    cellProps: {
      userId: (row) => row.original.id, // Asegúrate de que `id` es el ID de usuario
    },
  }),
  columnHelper.accessor("first_name", {
    id: "first_name",
    header: "Nombre",
    cell: NameCell,
  }),
  columnHelper.accessor("last_name", {
    id: "last_name",
    header: "Apellido",
    cell: LastNameCell,
  }),
  columnHelper.accessor("email", {
    id: "email",
    header: "Correo",
  }),
  columnHelper.accessor("role", {
    id: "role",
    header: "Rol",
    cell: RoleCell,
  }),
  columnHelper.accessor("entidades", {
    id: "entidades",
    header: "Entidades",
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <div
          className="max-w-[200px] whitespace-normal break-words overflow-hidden text-ellipsis"
          title={Array.isArray(value) ? value.join(", ") : value}
        >
          {Array.isArray(value) ? value.join(", ") : value}
        </div>
      );
    },
  }),
  columnHelper.accessor("is_active", {
    id: "reenviar_token",
    header: "Acciones",
    cell: ({ row }) => {
      const isActive = row.original.is_active;

      // Función para reenviar el token de restablecimiento de contraseña
      const handleResendToken = async () => {
        try {
          await axios.post(`/usuarios/${row.original.id}/resend_token/`);
          toast.success("Enlace de asignación de contraseña reenviado correctamente!");
        } catch (err) {
          toast.error("Error al reenviar el enlace de contraseña",err);
        }
      };

      return (
        !isActive && (  // Verifica si el usuario está desactivado
          <button
            onClick={handleResendToken}
            className="btn btn-primary"
            style={{ backgroundColor: '#4CAF50', color: 'white' }}
          >
            Reenviar Token
          </button>
        )
      );
    },
  }),

];




