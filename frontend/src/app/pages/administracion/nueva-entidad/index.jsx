// Import Dependencies
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { useAuthContext } from "app/contexts/auth/context";


// Local Imports
import { schema } from "./schema";
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";
import { CoverImageUpload } from "app/pages/forms/new-post-form/components/CoverImageUpload";
import { Combobox } from "components/shared/form/Combobox";
import NavBar from "app/layouts/MainLayout/NavBar";

// ----------------------------------------------------------------------

const initialState = {
    nombre: "",
    correo: "",
    telefono: "",
    responsable_id: "",
    usuarios: [],
    cover: null,
};

export default function NuevaEntidadPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        reset,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialState,
    });

    const { role } = useAuthContext();
    const [responsables, setResponsables] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [admins, setAdmins] = useState([]);  // Agrega el estado para administradores
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    //console.log(user?.role); 

    useEffect(() => {
        if (role === "superadmin") {
            setIsSuperAdmin(true);
        } else {
            setIsSuperAdmin(false);
        }
    }, [role]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const resResp = await axios.get("/users/?role=responsable");
                setResponsables(resResp.data);

                const resUsers = await axios.get("/users/?role=usuario");
                setUsuarios(resUsers.data);

                const resAdmins = await axios.get("/users/?role=admin");  // Asegúrate de que el endpoint esté correcto
                console.log("Administradores:", resAdmins.data);  // Verifica la respuesta en la consola
                setAdmins(resAdmins.data);

            } catch (err) {
                console.error("Error cargando usuarios:", err);
            }
        };

        fetchUsers();
    }, []);

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append("nombre", data.nombre);
            formData.append("correo", data.correo);
            formData.append("telefono", data.telefono);
            if (data.responsable_id) {
                formData.append("responsable_id", data.responsable_id);
            }
            if (data.usuarios && data.usuarios.length > 0) {
                data.usuarios.forEach((id) => {
                    formData.append("usuarios_ids", id);
                });
            }
            if (data.cover) {
                formData.append("foto_portada", data.cover);
            }

            if (isSuperAdmin && data.administrador_id) {
                formData.append("administrador_id", data.administrador_id);
            } else if (!isSuperAdmin) {
                // Si no es superadmin, asigna al admin actual automáticamente
                formData.append("administrador_id", /* El admin actual que hace el login */);
            }

            const res = await axios.post("/entidades/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Entidad creada con éxito 🚀");
            console.log("Respuesta:", res.data);
            reset();
        } catch (err) {
            console.error("Error al crear entidad:", err.response || err);
            toast.error("Error al crear entidad ❌");
        }
    };


    return (
        <Page title="Nueva Entidad">
            <NavBar showNotifications />

            <main className="pt-20 px-6">
                <div className="transition-content px-(--margin-x) pb-6">
                    <div className="flex flex-col items-center justify-between space-y-4 py-5 sm:flex-row sm:space-y-0 lg:py-6">
                        <div className="flex items-center gap-1">
                            <DocumentPlusIcon className="size-6" />
                            <h2 className="line-clamp-1 text-xl font-medium text-gray-700 dark:text-dark-50">
                                Nueva Entidad
                            </h2>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="min-w-[7rem]"
                                color="primary"
                                type="submit"
                                form="new-entity-form"
                            >
                                Guardar
                            </Button>
                        </div>
                    </div>

                    <form
                        autoComplete="off"
                        onSubmit={handleSubmit(onSubmit)}
                        id="new-entity-form"
                    >
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8">
                                <Card className="p-4 sm:px-5 space-y-5">
                                    <Input
                                        label="Nombre"
                                        placeholder="Ingrese el nombre"
                                        {...register("nombre")}
                                        error={errors?.nombre?.message}
                                    />

                                    <Input
                                        label="Correo electrónico"
                                        placeholder="ejemplo@correo.com"
                                        {...register("correo")}
                                        error={errors?.correo?.message}
                                    />

                                    <Input
                                        label="Teléfono"
                                        placeholder="+52 123 456 7890"
                                        {...register("telefono")}
                                        error={errors?.telefono?.message}
                                    />

                                    {/* Mostrar campo de administrador solo si es superadmin */}
                                    {isSuperAdmin && (
                                        <Controller
                                            render={({ field: { value, onChange, ...rest } }) => (
                                                <Combobox
                                                    data={admins}  // Usa el estado admins que ahora tiene los administradores
                                                    displayField="username"  // Asegúrate de que 'username' es el campo que quieres mostrar
                                                    value={admins.find((u) => u.id === value) || null}
                                                    onChange={(val) => onChange(val?.id)}
                                                    placeholder="Seleccione Administrador"
                                                    label="Administrador"
                                                    error={errors?.administrador_id?.message}
                                                    highlight
                                                    {...rest}
                                                />
                                            )}
                                            control={control}
                                            name="administrador_id"
                                        />
                                    )}

                                    {/* Responsable */}
                                    <Controller
                                        render={({ field: { value, onChange, ...rest } }) => (
                                            <Combobox
                                                data={responsables}
                                                displayField="username"
                                                value={responsables.find((r) => r.id === value) || null}
                                                onChange={(val) => onChange(val?.id)}
                                                placeholder="Seleccione Responsable"
                                                label="Responsable"
                                                error={errors?.responsable_id?.message}
                                                highlight
                                                {...rest}
                                            />
                                        )}
                                        control={control}
                                        name="responsable_id"
                                    />

                                    {/* Usuarios */}
                                    <Controller
                                        render={({ field: { value, onChange, ...rest } }) => (
                                            <Combobox
                                                multiple
                                                data={usuarios}
                                                displayField="username"
                                                value={usuarios.filter((u) => value?.includes(u.id))}
                                                onChange={(vals) => onChange(vals.map((v) => v.id))}
                                                placeholder="Seleccione usuarios"
                                                label="Usuarios"
                                                searchFields={["username", "email"]}
                                                error={errors?.usuarios?.message}
                                                highlight
                                                {...rest}
                                            />
                                        )}
                                        control={control}
                                        name="usuarios"
                                    />

                                    <Controller
                                        render={({ field }) => (
                                            <CoverImageUpload
                                                label="Foto de portada"
                                                error={errors?.cover?.message}
                                                {...field}
                                            />
                                        )}
                                        name="cover"
                                        control={control}
                                    />
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </Page>
    );
}