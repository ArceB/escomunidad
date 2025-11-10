import * as Yup from "yup";

export const schema = Yup.object().shape({
  nombre: Yup.string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(100, "El nombre es muy largo")
    .required("El nombre es obligatorio"),
  correo: Yup.string()
    .email("Debe ser un correo válido")
    .nullable(),
  telefono: Yup.string()
    .nullable()
    .test(
      "telefono-valido",
      "Número de teléfono inválido",
      (value) => !value || /^[0-9+\s-]{7,15}$/.test(value)
    ),
  responsable_id: Yup.string().required("Seleccione un responsable"),
  usuarios: Yup.array()
    .of(Yup.string())
    .min(1, "Debe seleccionar al menos un usuario"),
  cover: Yup.mixed()
    .nullable()
    .required("Debe subir una imagen de portada")
    .test(
      "fileSize",
      "El archivo no debe superar 4MB",
      (value) => value && value.size <= 4194304
    ),
});
