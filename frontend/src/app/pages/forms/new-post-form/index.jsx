// Import Dependencies
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DocumentPlusIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import axios from "utils/axios";

// Local Imports
import { schema } from "./schema";
import { Page } from "components/shared/Page";
import { Button, Card, Input } from "components/ui";
import { Delta, TextEditor } from "components/shared/form/TextEditor";
import { CoverImageUpload } from "./components/CoverImageUpload";
import { PdfUpload } from "./components/PdfUpload";
import { DatePicker } from "components/shared/form/Datepicker";

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
    [{ direction: "rtl" }],
    [{ size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }, "image"],
    ["clean"],
  ],
};

const NewPostForm = ({ entidadId }) => {
  console.log("Entidad ID recibido en formulario:", entidadId);

  const { anuncioId } = useParams(); // Obtener el ID del anuncio desde la URL}
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
  });

  useEffect(() => {
    if (!anuncioId) return;

    const fetchAnuncio = async () => {
      try {
        const res = await axios.get(`/anuncios/${anuncioId}/`);
        const anuncio = res.data;

        reset({
          titulo: anuncio.titulo || "",
          frase: anuncio.frase || "",
          descripcion: anuncio.descripcion ? new Delta([{ insert: anuncio.descripcion }]) : new Delta(),
          banner: null,
          archivo_pdf: null,
          fecha_inicio: anuncio.fecha_inicio || "",
          fecha_fin: anuncio.fecha_fin || "",
        });

        setExistingCover(anuncio.banner || null);
        setExistingPdf(anuncio.archivo_pdf || null);
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
      formData.append(
        "descripcion",
        data.descripcion.ops.map((op) => op.insert).join("")
      );

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

      console.log("Entidad ID recibido en formulario:", entidadId);
      formData.append("entidad", entidadId);

      const token = sessionStorage.getItem("authToken");


      if (anuncioId) {
        // Si estamos editando, hacemos un PUT
        await axios.put(`http://localhost:8000/api/anuncios/${anuncioId}/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("Anuncio actualizado con éxito 🚀");
      } else {
        // Si estamos creando, hacemos un POST
        await axios.post("http://localhost:8000/api/anuncios/", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success("Anuncio creado con éxito 🚀");
      }
      navigate(`/administracion/entidades/${entidadId}/anuncios`);
    } catch (err) {
      console.error("Error al crear o editar anuncio:", err.response || err);
      toast.error("Error al crear o editar anuncio ❌");
    }
  };

  return (
    <Page ttitle={anuncioId ? "Editar Anuncio" : "Nuevo Anuncio"}>
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
              {anuncioId ? "Actualizar" : "Publicar"}
            </Button>
          </div>
        </div>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)} id="new-post-form">
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
                          {...rest}
                        />
                      )}
                    />
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
