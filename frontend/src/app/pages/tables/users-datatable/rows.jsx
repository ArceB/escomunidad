// Import Dependencies
import { useState } from "react";
import { toast } from "sonner";
import PropTypes from "prop-types";

// Local Imports
import {  Badge } from "components/ui";
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

LastNameCell.propTypes = {
  getValue: PropTypes.func,
};


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

EntitiesCell.propTypes = {
  getValue: PropTypes.func,
};


export function StatusCell({
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
      toast.success("User status updated");
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

NameCell.propTypes = {
  getValue: PropTypes.func,
  row: PropTypes.object,
  column: PropTypes.object,
  table: PropTypes.object,
};

RoleCell.propTypes = {
  getValue: PropTypes.func,
};

StatusCell.propTypes = {
  getValue: PropTypes.func,
  row: PropTypes.object,
  column: PropTypes.object,
  table: PropTypes.object,
};
