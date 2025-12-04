// src/app/pages/administracion/nuevo-usuario/index.jsx

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { UserIcon } from "@heroicons/react/20/solid";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import * as yup from "yup";
import { toast } from "sonner";
import axios from "utils/axios";
import { useNavigate } from "react-router";

// UI Components
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";
import NavBar from "app/layouts/MainLayout/NavBar";
import { Combobox } from "components/shared/form/Combobox";

// ------------------- Opciones de roles -------------------
const ROLE_OPTIONS = [
  { label: "Usuario", value: "usuario" },
  { label: "Responsable", value: "responsable" },
  { label: "Administrador", value: "admin" },
  { label: "Superadministrador", value: "superadmin" },
];

// ------------------- Validación -------------------
const schema = yup.object().shape({
  first_name: yup.string().required("El nombre es obligatorio"),
  last_name: yup.string().required("El apellido es obligatorio"),
  email: yup
    .string()
    .email("Correo inválido")
    .required("El correo es obligatorio"),
  role: yup
    .string()
    .oneOf(ROLE_OPTIONS.map((r) => r.value))
    .required("Debe seleccionar un rol"),
});

// ------------------- Formulario -------------------
const NewUserForm = () => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
    },
  });

  const navigate = useNavigate(); 

  const onSubmit = async (data) => {
    try {
      const token = sessionStorage.getItem("authToken");

      await axios.post("/usuarios/", data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(
        `Usuario "${data.first_name} ${data.last_name}" creado. Se envió un correo para asignar la contraseña ✅`
      );
      navigate("/administracion/users-datatable");

      reset();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear usuario ❌");
    }
  };

  return (
    <Page title="Nuevo usuario">
      <NavBar showNotifications />

      <main className="pt-20 px-6">
        <div className="transition-content px-(--margin-x) pb-6">
          {/* Encabezado con botón arriba */}
          <div className="flex flex-col items-center justify-between space-y-4 py-5 sm:flex-row sm:space-y-0 lg:py-6">
            <div className="flex items-center gap-1">
              <h2 className="line-clamp-1 text-xl font-medium text-gray-700 dark:text-dark-50">
                Nuevo Usuario
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                className="min-w-[7rem]"
                color="primary"
                type="submit"
                form="new-user-form" // ← Esto asegura que dispare el onSubmit del form
              >
                Crear Usuario
              </Button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} id="new-user-form">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <Card className="p-4 sm:px-5 space-y-5">
                  <Input
                    label="Nombre *"
                    placeholder="Ingrese el nombre"
                    prefix={<UserIcon className="size-5" />}
                    {...register("first_name")}
                    error={errors.first_name?.message}
                  />

                  <Input
                    label="Apellido *"
                    placeholder="Ingrese el apellido"
                    prefix={<UserIcon className="size-5" />}
                    {...register("last_name")}
                    error={errors.last_name?.message}
                  />

                  <Input
                    label="Correo electrónico *"
                    placeholder="ejemplo@correo.com"
                    prefix={<EnvelopeIcon className="size-5" />}
                    {...register("email")}
                    error={errors.email?.message}
                  />

                  {/* Rol */}
                  <Controller
                    render={({ field: { value, onChange, ...rest } }) => (
                      <Combobox
                        data={ROLE_OPTIONS}
                        displayField="label"
                        value={ROLE_OPTIONS.find((r) => r.value === value) || null}
                        onChange={(val) => onChange(val?.value)}
                        placeholder="Seleccione un rol *"
                        label="Rol"
                        error={errors?.role?.message}
                        highlight
                        {...rest}
                      />
                    )}
                    control={control}
                    name="role"
                  />
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
    </Page>

  );
};

export default NewUserForm;
