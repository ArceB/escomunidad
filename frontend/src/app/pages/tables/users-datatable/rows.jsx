// Import Dependencies
import { useState } from "react";
import { toast } from "sonner";
import PropTypes from "prop-types";
import axios from "utils/axios";

// Local Imports
import { Badge } from "components/ui";
import { StyledSwitch } from "components/shared/form/StyledSwitch";
import { rolesOptions } from "./data";

// ----------------------------------------------------------------------

export function NameCell({ getValue }) {
  return (
    <div className="font-medium text-gray-800 dark:text-dark-100">
      {String(getValue() ?? "")}
    </div>
  );
}

export function LastNameCell({ getValue }) {
  return (
    <div className="font-medium text-gray-800 dark:text-dark-100">
      {String(getValue() ?? "")}
    </div>
  );
}

export function RoleCell({ getValue }) {
  const val = getValue();
  const option = rolesOptions.find((item) => item.value === val);

  if (!option) {
    return <span className="text-gray-500 text-sm">{val || "Sin rol"}</span>;
  }

  return (
    <Badge color={option.color} variant="outlined">
      {option.label}
    </Badge>
  );
}


export function EntitiesCell({ getValue }) {
  const entidades = getValue();
  return (
    <div className="text-gray-800 dark:text-dark-100 text-sm">
      {entidades?.length > 0 ? entidades.join(", ") : "Sin entidad"}
    </div>
  );
}

export function StatusCell({ row }) {
  const userId = row.original.id;
  const initialStatus = row.original.is_active;

  const [active, setActive] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked) => {
    setLoading(true);
    try {
      await axios.patch(`/users/${userId}/toggle_active/`, { is_active: checked });
      setActive(checked);
      toast.success(`Usuario ${checked ? "activado" : "desactivado"} correctamente`);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <StyledSwitch
        checked={active}
        onChange={handleToggle}
        loading={loading}
      />
    </div>
  );
}

export function StatusToggleCell({
  getValue,
  row: { index },
  column: { id },
  table,
}) {
  const val = getValue();
  const [loading, setLoading] = useState(false);

  const onChange = async (checked) => {
    setLoading(true);
    setTimeout(() => {
      table.options.meta?.updateData(index, id, checked);
      toast.success("Estado del usuario actualizado");
      setLoading(false);
    }, 1000);
  };

  return (
    <StyledSwitch
      className="mx-auto"
      checked={val}
      onChange={onChange}
      loading={loading}
    />
  );
}

EntitiesCell.propTypes = {
  getValue: PropTypes.func,
};
NameCell.propTypes = {
  getValue: PropTypes.func,
  row: PropTypes.object,
  column: PropTypes.object,
  table: PropTypes.object,
};
LastNameCell.propTypes = {
  getValue: PropTypes.func,
};
RoleCell.propTypes = {
  getValue: PropTypes.func,
};
StatusToggleCell.propTypes = {
  getValue: PropTypes.func,
  row: PropTypes.object,
  column: PropTypes.object,
  table: PropTypes.object,
};
