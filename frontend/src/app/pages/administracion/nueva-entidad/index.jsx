// Import Dependencies
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { useAuthContext } from "app/contexts/auth/context";
import { useNavigate, useParams } from "react-router";
import Quill from "quill";
import { Delta, TextEditor } from "components/shared/form/TextEditor";


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
    descripcion: new Delta(),
    correo: "",
    telefono: "",
    responsable_id: "",
    usuarios: [],
    cover: null,
};
const editorModules = {
    toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ header: 1 }, { header: 2 }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }, "image"],
        ["clean"],
    ],
    clipboard: {
        matchers: [
            ["A", (node, delta) => {
                delta.ops.forEach((op) => {
                    if (op.insert && typeof op.insert === "string") {
                        op.attributes = op.attributes || {};
                        op.attributes.link = node.getAttribute("href");
                    }
                });
                return delta;
            }],
        ],
    },
};

export default function NuevaEntidadPage() {
    const navigate = useNavigate();
    const { id: entidadId } = useParams();
    const [existingCover, setExistingCover] = useState(null);
    //const [entity, setEntity] = useState(null);
    //const [editorReady, setEditorReady] = useState(false);

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
    const { user } = useAuthContext();
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

    useEffect(() => {
        if (!entidadId) {
            reset(initialState);
            setExistingCover(null);
            return;
        }

        const fetchEntityData = async () => {
            try {
                const res = await axios.get(`/entidades/${entidadId}`);
                const entityData = res.data;

                setExistingCover(entityData.foto_portada || null);

                // Convertir HTML a Delta CORRECTAMENTE
                // Convertir HTML a Delta CORRECTAMENTE
                // Convertir HTML a Delta sin warnings
                let descripcionDelta = new Delta();
                if (entityData.descripcion) {
                    console.log("HTML recibido:", entityData.descripcion);

                    // Método sin warnings: usar solo clipboard.convert
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = entityData.descripcion;

                    const tempQuill = new Quill(document.createElement('div'));
                    descripcionDelta = tempQuill.clipboard.convert({
                        html: entityData.descripcion
                    });

                    console.log("Delta convertido:", descripcionDelta);
                    console.log("Delta ops:", descripcionDelta.ops);
                }

                // Reset del formulario con los datos completos
                reset({
                    nombre: entityData.nombre || "",
                    correo: entityData.correo || "",
                    telefono: entityData.telefono || "",
                    descripcion: descripcionDelta,
                    responsable_id: entityData.responsable_id || "",
                    usuarios: entityData.usuarios_ids || [],
                    administrador_id: entityData.administrador_id || "",
                    cover: null,
                });

            } catch (err) {
                console.error("Error al cargar la entidad:", err);
                toast.error("Error al cargar la entidad ❌");
            }
        };

        fetchEntityData();
    }, [entidadId, reset]);

    const onSubmit = async (data) => {
        try {
            const formData = new FormData();
            formData.append("nombre", data.nombre);
            formData.append("correo", data.correo);
            formData.append("telefono", data.telefono);

            const tempQuill = new Quill(document.createElement("div"));
            tempQuill.setContents(data.descripcion);
            const descripcionHTML = tempQuill.root.innerHTML;
            formData.append("descripcion", descripcionHTML);

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
                formData.append("administrador_input", data.administrador_id);
            } else if (!isSuperAdmin) {
                const currentAdminId = user?.id;  // Obtener el admin actual
                formData.append("administrador_input", currentAdminId);
            }

            if (entidadId) {
                // Si estamos editando, hacemos un PUT
                await axios.put(`/entidades/${entidadId}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                toast.success("Entidad actualizada con éxito 🚀");
            } else {
                // Si estamos creando, hacemos un POST
                await axios.post("/entidades/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                toast.success("Entidad creada con éxito 🚀");
            }

            navigate("/administracion/entidades");
        } catch (err) {
            console.error("Error al crear entidad:", err.response || err);
            toast.error("Error al crear entidad ❌");
        }
    };

    return (
        <Page title={entidadId ? "Editar Entidad" : "Nueva Entidad"}>
            <NavBar showNotifications />

            <main className="pt-20 px-6">
                <div className="transition-content px-(--margin-x) pb-6">
                    <div className="flex flex-col items-center justify-between space-y-4 py-5 sm:flex-row sm:space-y-0 lg:py-6">
                        <div className="flex items-center gap-1">
                            <DocumentPlusIcon className="size-6" />
                            <h2 className="line-clamp-1 text-xl font-medium text-gray-700 dark:text-dark-50">
                                {entidadId ? "Editar Entidad" : "Nueva Entidad"}
                            </h2>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                className="min-w-[7rem]"
                                color="primary"
                                type="submit"
                                form="new-entity-form"
                            >
                                {entidadId ? "Actualizar" : "Guardar"}
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
                                        placeholder="55112233"
                                        {...register("telefono")}
                                        error={errors?.telefono?.message}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-700 dark:text-dark-50">Descripción</span>
                                        <Controller
                                            name="descripcion"
                                            control={control}
                                            render={({ field: { value, onChange, ...rest } }) => (
                                                <TextEditor
                                                    value={value}
                                                    onChange={(delta) => onChange(delta)}
                                                    placeholder="Escribe una breve descripción..."
                                                    modules={editorModules}
                                                    className="mt-1.5 [&_.ql-editor]:max-h-80 [&_.ql-editor]:min-h-[12rem]"
                                                    error={errors?.descripcion?.message}
                                                    {...rest}
                                                />
                                            )}
                                        />
                                    </div>
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
                                                existingImage={existingCover}
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