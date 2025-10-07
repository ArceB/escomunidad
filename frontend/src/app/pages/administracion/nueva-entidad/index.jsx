// Import Dependencies
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { useAuthContext } from "app/contexts/auth/context";
import { useParams, useNavigate } from "react-router";




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

    const { role, user } = useAuthContext();


    const [responsables, setResponsables] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [administradores, setAdministradores] = useState([]);

    const { id } = useParams(); // si existe, estamos editando
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [existingCover, setExistingCover] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                if (role === "superadmin") {
                    const resAdmin = await axios.get("/users/?role=admin");
                    setAdministradores(resAdmin.data);
                }

                const resResp = await axios.get("/users/?role=responsable");
                setResponsables(resResp.data);

                const resUsers = await axios.get("/users/?role=usuario");
                setUsuarios(resUsers.data);
            } catch (err) {
                console.error("Error cargando usuarios:", err);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        console.log("Administradores cargados:", administradores);

        if (!isEditing) return;

        const fetchEntidad = async () => {
            try {
                const res = await axios.get(`/entidades/${id}/`);
                const entidad = res.data;

                console.log("Entidad cargada:", entidad);
                console.log("Administrador ID:", entidad.administrador_id);

                // Realizamos el reset con los datos de la entidad
                reset({
                    nombre: entidad.nombre || "",
                    correo: entidad.correo || "",
                    telefono: entidad.telefono || "",
                    responsable_id: entidad.responsable?.id || "",
                    usuarios: entidad.usuarios?.map((u) => u.id) || [],
                    administrador_id: entidad.administrador_id || "",
                    cover: null,
                });

                setExistingCover(entidad.foto_portada || null);
            } catch (err) {
                console.error("Error cargando entidad:", err);
                toast.error("No se pudo cargar la entidad.");
            }
        };

        fetchEntidad();
    }, [id, isEditing, reset]);



    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append("nombre", data.nombre);
            formData.append("correo", data.correo);
            formData.append("telefono", data.telefono);

            if (role === "superadmin" && data.administrador_id) {
                formData.append("administrador_id", data.administrador_id);
            } else if (role === "admin") {
                formData.append("administrador_id", user.id); // se asigna automáticamente
            }

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

            // 🟢 CREAR o EDITAR según el modo
            if (isEditing) {
                // Si estamos editando, se hace PUT
                await axios.put(`/entidades/${id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Entidad actualizada ✅");
            } else {
                // Si estamos creando, se hace POST
                await axios.post("/entidades/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Entidad creada con éxito 🚀");
            }

            // 🔁 Redirigir al listado de entidades
            navigate("/administracion/entidades");
        } catch (err) {
            console.error("Error al guardar entidad:", err.response || err);
            toast.error("Error al guardar entidad ❌");
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

                                    {/* Administrador */}
                                    {role === "superadmin" && (
                                        <Controller
                                            render={({ field: { value, onChange, ...rest } }) => (
                                                <Combobox
                                                    data={administradores}
                                                    displayField="username"
                                                    value={administradores.find((a) => a.id === value) || null}
                                                    onChange={(val) => onChange(val?.id)}
                                                    placeholder="Seleccione Administrador"
                                                    label="Administrador"
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
                                                existingImage={existingCover}
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
