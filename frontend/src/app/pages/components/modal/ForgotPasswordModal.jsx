import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Transition,
    TransitionChild,
} from "@headlessui/react";
import { Fragment, useState } from "react";
import { EnvelopeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import axios from "utils/axios";
import { Input, Button } from "components/ui";
import { toast } from "sonner";


export default function ForgotPasswordModal({ isOpen, close }) {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSend = async () => {
        setError("");

        try {
            await axios.post("auth/forgot-password/", { email });

            setSent(true);
            toast.success("Se ha enviado un enlace para recuperar tu contraseña.");
        } catch (err) {
            console.log("🔥 ERROR COMPLETO:", err);

            const backendMsg =
                err?.error ||             // cuando viene del interceptor
                err.response?.data?.error

            if (backendMsg) {
                toast.error(backendMsg);
                //setError(backendMsg);
            } else {
                toast.error("Ocurrió un error al enviar el correo");
            }

            setSent(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
                onClose={close}
            >
                {/* Fondo */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-900/50 dark:bg-black/40" />
                </TransitionChild>

                {/* Modal */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4"
                    enterTo="opacity-100 translate-y-0"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-4"
                >
                    <DialogPanel className="relative max-w-md w-full rounded-lg bg-white dark:bg-dark-700 px-6 py-10 text-center shadow-lg">

                        {!sent ? (
                            <>
                                <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-dark-100">
                                    Recuperar contraseña
                                </DialogTitle>

                                <p className="mt-2 text-gray-500">
                                    Ingresa tu correo y te enviaremos un enlace para recuperar tu contraseña.
                                </p>

                                <div className="mt-1 rounded-lg p-5 lg:p-7">
                                    <Input
                                        prefix={<EnvelopeIcon className="size-5" strokeWidth="1" />}
                                        placeholder="Ingresa correo electrónico"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    //className="mt-6"
                                    />

                                    {error && (
                                        <p className="mt-2 text-sm text-red-500 font-medium">
                                            {error} {/* ← Aquí se mostrará: "No existe un usuario con ese correo" */}
                                        </p>
                                    )}

                                    <Button
                                        onClick={handleSend}
                                        color="primary"
                                        className="mt-6 w-full"
                                    >
                                        Enviar enlace
                                    </Button>

                                    <Button
                                        onClick={close}
                                        variant="plain"
                                        className="mt-3 w-full"
                                    >
                                        Cancelar
                                    </Button>
                                </div>


                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="mx-auto size-20 text-success" />
                                <h3 className="mt-4 text-xl font-medium text-gray-700 dark:text-dark-100">
                                    ¡Enlace enviado!
                                </h3>
                                <p className="mt-2 text-gray-500">
                                    Si el correo ingresado está registrado, recibirás un mensaje con el enlace para restablecer tu contraseña.
                                </p>

                                <Button
                                    onClick={close}
                                    color="success"
                                    className="mt-6 w-full"
                                >
                                    Cerrar
                                </Button>
                            </>
                        )}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
