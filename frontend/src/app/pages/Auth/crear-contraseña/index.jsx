// src/app/pages/auth/crear-contraseña/index.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import axios from "utils/axios";
import Logo from "assets/appLogo.svg?react";

// UI Components
import { Page } from "components/shared/Page";
import { Card, Input, Button } from "components/ui";

// ------------------- Validación -------------------
const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .required("Ingrese su contraseña"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Las contraseñas no coinciden")
    .required("Confirme su contraseña"),
});

// ------------------- Componente -------------------
const CrearContrasenaPage = () => {
  const { token } = useParams(); // Token temporal en URL
  const navigate = useNavigate();
  const [validToken, setValidToken] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  // Verificar token al cargar la página
  useEffect(() => {
    const verificarToken = async () => {
      try {
        await axios.get(`/auth/verify-reset-token/?token=${token}`);
        setValidToken(true);
      } catch (err) {
        toast.error("Token inválido o expirado ❌", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) verificarToken();
  }, [token]);

  const onSubmit = async (data) => {
    try {
      await axios.post(`/auth/reset-password/`, {
        token,
        password: data.password,
      });

      toast.success("Contraseña asignada correctamente ✅");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo asignar la contraseña ❌");
    }
  };

  if (loading) return <Page title="Cargando...">Validando token...</Page>;
  if (!validToken) return <Page title="Token inválido">El enlace no es válido o expiró.</Page>;

  return (
    <Page title="Login">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="text-xl font-medium text-gray-700 dark:text-dark-50">
                Crear nueva contraseña
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-200">
                Ingrese su nueva contraseña para poder acceder a su cuenta.
              </p>
            </div>
          </div>

          <Card className="mt-5 rounded-lg p-5 lg:p-7">


            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Contraseña"
                type="password"
                placeholder="Ingrese su contraseña"
                {...register("password")}
                error={errors.password?.message}
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="Confirme su contraseña"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />

              <Button color="primary" type="submit" className="w-full mt-4">
                Guardar contraseña
              </Button>
            </form>
          </Card>

          <div className="mt-8 flex justify-center text-xs text-gray-400 dark:text-dark-300">
            <a href="##">Privacy Notice</a>
            <div className="mx-2.5 my-0.5 w-px bg-gray-200 dark:bg-dark-500"></div>
            <a href="##">Term of service</a>
          </div>
        </div>
      </main>
    </Page>


    /*<Page title="Asignar contraseña">
      <div className="w-full fixed top-0 left-0 z-50">
        <NavBar />
      </div>
      <main className="pt-[65px] min-h-screen flex flex-col items-center bg-gray-50 dark:bg-dark-900 space-y-10 [overflow-anchor:none]">
        <Card className="p-6 sm:p-8 max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-medium text-gray-700 dark:text-dark-50">
            Crear nueva contraseña
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-200">
            Ingrese su nueva contraseña para poder acceder a su cuenta.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Contraseña"
              type="password"
              placeholder="Ingrese su contraseña"
              {...register("password")}
              error={errors.password?.message}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Confirme su contraseña"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <Button color="primary" type="submit" className="w-full mt-4">
              Guardar contraseña
            </Button>
          </form>
        </Card>
      </main>
    </Page>*/
  );
};

export default CrearContrasenaPage;
