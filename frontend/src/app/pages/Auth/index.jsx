// Import Dependencies
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useDisclosure } from "hooks";


// Local Imports
import Logo from "assets/appLogo.svg?react";
import { Button, Card, Input, InputErrorMsg } from "components/ui";
import { useAuthContext } from "app/contexts/auth/context";
import { schema } from "./schema";
import { Page } from "components/shared/Page";
import ForgotPasswordModal from "app/pages/components/modal/ForgotPasswordModal";


// ----------------------------------------------------------------------

export default function SignIn() {
  const { login, errorMessage } = useAuthContext();
  const [isModalOpen, { open, close }] = useDisclosure(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await login({
        username: data.username,
        password: data.password,
      });
      // 👇 Ya no usamos navigate aquí
      // GhostGuard se encarga de redirigir según rol
    } catch {
      /* el error ya lo maneja el contexto */
    }
  };

  return (
    <Page title="Login">
      <main className="min-h-100vh grid w-full grow grid-cols-1 place-items-center">
        <div className="w-full max-w-[26rem] p-4 sm:px-5">
          <div className="text-center">
            <Logo className="mx-auto size-16" />
            <div className="mt-4">
              <h2 className="text-2xl font-semibold text-gray-600 dark:text-dark-100">
                ¡Bienvenido!
              </h2>
              <p className="text-gray-400 dark:text-dark-300">
                Por favor inicia sesión para continuar
              </p>
            </div>
          </div>

          <Card className="mt-5 rounded-lg p-5 lg:p-7">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <div className="space-y-4">
                <Input
                  label="Nombre de usuario"
                  placeholder="Ingresa nombre de usuario"
                  prefix={<EnvelopeIcon className="size-5" strokeWidth="1" />}
                  {...register("username")}
                  error={errors?.username?.message}
                />
                <Input
                  label="Contraseña"
                  placeholder="Ingresa contraseña"
                  type="password"
                  prefix={<LockClosedIcon className="size-5" strokeWidth="1" />}
                  {...register("password")}
                  error={errors?.password?.message}
                />
              </div>

              <div className="mt-2">
                <InputErrorMsg when={Boolean(errorMessage)}>
                  {typeof errorMessage === "string"
                    ? errorMessage
                    : errorMessage?.message}
                </InputErrorMsg>
              </div>

              <div className="mt-4 flex items-center justify-between space-x-2">
                <a
                  onClick={open}
                  className="cursor-pointer text-xs text-gray-400 hover:text-gray-800 dark:hover:text-dark-100"
                >
                  ¿Olvidaste tu contraseña?
                </a>

                <ForgotPasswordModal isOpen={isModalOpen} close={close} />
              </div>

              <Button type="submit" className="mt-5 w-full" color="primary">
                Iniciar Sesión
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
  );
}
