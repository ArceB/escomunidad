// Import Dependencies
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import axios from "utils/axios";
import Quill from "quill";

// Local Imports
import { schema } from "./schema";
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";
import { Delta, TextEditor } from "components/shared/form/TextEditor";
import { CoverImageUpload } from "./components/CoverImageUpload";
import { PdfUpload } from "./components/PdfUpload";
import { DatePicker } from "components/shared/form/Datepicker";
import RechazoDrawer from "app/pages/components/drawer/RechazoDrawer";
//import styles from './NewPostForm.module.css';
import "./NewPostForm.css";

// ----------------------------------------------------------------------

const initialState = {
  titulo: "",
  frase: "",
  descripcion: new Delta(),
  banner: null,
  archivo_pdf: null,
  fecha_inicio: "",
  fecha_fin: "",
};

const editorModules = {
  toolbar: [
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ header: 1 }, { header: 2 }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }],
    [{ indent: "-1" }, { indent: "+1" }],
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
      // 🔥 NUEVO: Interceptar y eliminar formatos RTL de cualquier contenido pegado
      [Node.ELEMENT_NODE, (node, delta) => {
        delta.ops = delta.ops.map(op => {
          if (op.attributes) {
            const { align, ...rest } = op.attributes;

            if (align === "right") {
              return { ...op, attributes: Object.keys(rest).length > 0 ? rest : undefined };
            }

            return { ...op, attributes: rest };

          }
          return op;
        });
        return delta;
      }],
    ],
  },
};

const NewPostForm = ({ entidadId }) => {

  const { anuncioId } = useParams();
  const isEditing = !!anuncioId;
  const [anuncio, setAnuncio] = useState(null); // ✅ estado del anuncio
  const [existingCover, setExistingCover] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialState,
    context: { isEditing: isEditing },
  });

  // 🔹 Cargar anuncio si estamos en modo edición
  useEffect(() => {
    if (!anuncioId) {
      reset(initialState);
      setAnuncio(null);
      setExistingCover(null);
      setExistingPdf(null);
      return;
    }

    const fetchAnuncio = async () => {
      try {
        const res = await axios.get(`/anuncios/${anuncioId}/`);
        const anuncioData = res.data;

        setAnuncio(anuncioData);
        setExistingCover(anuncioData.banner || null);
        setExistingPdf(anuncioData.archivo_pdf || null);

        // Convertir HTML a Delta correctamente SIN heredar RTL
        let descripcionDelta = new Delta();
        if (anuncioData.descripcion) {
          // 🔥 Crear un contenedor aislado con dirección LTR forzada
          const tempContainer = document.createElement('div');
          tempContainer.style.direction = 'ltr';
          tempContainer.style.textAlign = 'left';
          tempContainer.setAttribute('dir', 'ltr');

          const tempQuill = new Quill(tempContainer, {
            modules: {}
          });

          // Forzar dirección LTR en el editor temporal
          tempQuill.root.style.direction = 'ltr';
          tempQuill.root.style.textAlign = 'left';
          tempQuill.root.setAttribute('dir', 'ltr');

          descripcionDelta = tempQuill.clipboard.convert({
            html: anuncioData.descripcion
          });

          if (descripcionDelta.ops) {
            descripcionDelta.ops = descripcionDelta.ops.map(op => {
              if (op.attributes) {
                const { ...rest } = op.attributes;

                if (Object.keys(rest).length > 0) {
                  return { ...op, attributes: rest };
                } else {
                  const newOp = { ...op };
                  delete newOp.attributes;
                  return newOp;
                }
              }

              return op;
            });
          }
        }

        reset({
          titulo: anuncioData.titulo || "",
          frase: anuncioData.frase || "",
          descripcion: descripcionDelta,
          banner: null,
          archivo_pdf: null,
          fecha_inicio: anuncioData.fecha_inicio || "",
          fecha_fin: anuncioData.fecha_fin || "",
        });

      } catch (err) {
        console.error("Error al cargar el anuncio:", err);
        toast.error("Error al cargar el anuncio ❌");
      }
    };

    fetchAnuncio();
  }, [anuncioId, reset]);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("titulo", data.titulo);
      formData.append("frase", data.frase);

      const tempQuill = new Quill(document.createElement("div"));
      tempQuill.setContents(data.descripcion);
      const descripcionHTML = tempQuill.root.innerHTML;
      formData.append("descripcion", descripcionHTML);

      if (data.fecha_inicio) {
        formData.append(
          "fecha_inicio",
          new Date(data.fecha_inicio).toISOString().split("T")[0]
        );
      }
      if (data.fecha_fin) {
        formData.append(
          "fecha_fin",
          new Date(data.fecha_fin).toISOString().split("T")[0]
        );
      }

      if (data.banner) formData.append("banner", data.banner);
      if (data.archivo_pdf) formData.append("archivo_pdf", data.archivo_pdf);

      formData.append("entidad", entidadId);

      const token = sessionStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      if (anuncioId) {
        // Si el anuncio está rechazado, vuelve a "pendiente"
        if (anuncio?.estado === "rechazado") {
          formData.append("estado", "pendiente");
        }

        await axios.put(`/anuncios/${anuncioId}/`, formData, { headers });
        toast.success("Anuncio actualizado con éxito 🚀 (en revisión)");
      } else {
        await axios.post("/anuncios/", formData, { headers });
        toast.success("Anuncio creado con éxito 🚀");
      }

      navigate(`/administracion/entidades/${entidadId}/anuncios`);
    } catch (err) {
      console.error("Error al crear o editar anuncio:", err.response || err);
      toast.error("Error al crear o editar anuncio ❌");
    }
  };

  return (
    <Page title={anuncioId ? "Editar Anuncio" : "Nuevo Anuncio"}>
      {/* ✅ Drawer visible solo si el anuncio está rechazado */}
      {anuncio?.estado === "rechazado" && (
        <RechazoDrawer
          comentario={anuncio.comentarios_rechazo}
          titulo={anuncio.titulo}
        />
      )}

      <div className="transition-content px-(--margin-x) pb-6">
        <div className="flex flex-col items-center justify-between space-y-4 py-5 sm:flex-row sm:space-y-0 lg:py-6">
          <div className="flex items-center gap-1">
            <DocumentPlusIcon className="size-6" />
            <h2 className="line-clamp-1 text-xl font-medium text-gray-700 dark:text-dark-50">
              {anuncioId ? "Editar Anuncio" : "Nuevo Anuncio"}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              className="min-w-[7rem]"
              color="primary"
              type="submit"
              form="new-post-form"
            >
              Guardar
            </Button>
          </div>
        </div>

        <form
          autoComplete="off"
          onSubmit={handleSubmit(onSubmit)}
          id="new-post-form"
        >
          <div className="grid grid-cols-12 place-content-start gap-4 sm:gap-5 lg:gap-6">
            <div className="col-span-12 lg:col-span-8">
              <Card className="p-4 sm:px-5">
                <div className="mt-5 space-y-5">
                  <Input
                    label="Título"
                    placeholder="Ingrese el título del anuncio"
                    {...register("titulo")}
                    error={errors?.titulo?.message}
                  />
                  <Input
                    label="Frase"
                    placeholder="Ingrese una frase para el anuncio"
                    {...register("frase")}
                    error={errors?.frase?.message}
                  />

                  <div className="flex flex-col">
                    <span>Descripción</span>
                    <div className="quill-editor-wrapper">
                      <Controller
                        control={control}
                        name="descripcion"
                        render={({ field: { value, onChange, ...rest } }) => (
                          <TextEditor
                            value={value}
                            onChange={(val) => onChange(val)}
                            placeholder="Ingrese el contenido del anuncio..."
                            className="mt-1.5 [&_.ql-editor]:max-h-80 [&_.ql-editor]:min-h-[12rem]"
                            modules={editorModules}
                            error={errors?.descripcion?.message}
                            onReady={(quill) => {
                              const editorElement = quill.root;
                              editorElement.setAttribute('dir', 'ltr');
                              editorElement.style.direction = 'ltr';
                              editorElement.style.textAlign = 'left';
                            }}
                            {...rest}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <Controller
                    render={({ field }) => (
                      <CoverImageUpload
                        classNames={{ box: "mt-1.5" }}
                        label="Imagen del banner"
                        error={errors?.banner?.message}
                        existingImage={existingCover}
                        {...field}
                      />
                    )}
                    name="banner"
                    control={control}
                  />

                  <Controller
                    render={({ field }) => (
                      <PdfUpload
                        classNames={{ box: "mt-1.5" }}
                        label="Adjuntar archivo"
                        error={errors?.archivo_pdf?.message}
                        existingFile={existingPdf}
                        {...field}
                      />
                    )}
                    name="archivo_pdf"
                    control={control}
                  />
                </div>
              </Card>
            </div>

            <div className="col-span-12 space-y-4 sm:space-y-5 lg:col-span-4 lg:space-y-6">
              <Card className="space-y-5 p-4 sm:px-5">
                <Controller
                  render={({ field: { onChange, value, ...rest } }) => (
                    <DatePicker
                      onChange={onChange}
                      value={value || ""}
                      label="Fecha de inicio"
                      error={errors?.publish_date?.message}
                      options={{ disableMobile: true }}
                      placeholder="Choose date..."
                      {...rest}
                    />
                  )}
                  control={control}
                  name="fecha_inicio"
                />
                <Controller
                  render={({ field: { onChange, value, ...rest } }) => (
                    <DatePicker
                      onChange={onChange}
                      value={value || ""}
                      label="Fecha de finalización"
                      error={errors?.publish_date?.message}
                      options={{ disableMobile: true }}
                      placeholder="Choose date..."
                      {...rest}
                    />
                  )}
                  control={control}
                  name="fecha_fin"
                />
              </Card>
            </div>
          </div>
        </form>
      </div>
    </Page>
  );
};

export default NewPostForm;
