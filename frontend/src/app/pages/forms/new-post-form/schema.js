// Import Dependencies
import * as Yup from 'yup'

// Local Imports
import { isDeltaNotEmpty } from 'utils/quillUtils'

// ----------------------------------------------------------------------

export const schema = Yup.object().shape({
  titulo: Yup.string()
    .trim()
    .min(2, "El título es muy corto")
    .max(200, "El título es muy largo")
    .required("Título requerido"),

  frase: Yup.string()
    .trim()
    .min(2, "La frase es muy corta")
    .max(255, "La frase es muy larga")
    .required("Frase requerida"),

  descripcion: Yup.object()
    .required("Descripción requerida")
    .test("notEmpty", "La descripción no puede estar vacía", isDeltaNotEmpty),
  banner: Yup.mixed().nullable()
    .when("$isEditing", { // Revisa el contexto que pasamos
      is: (isEditing) => isEditing === true, // Si isEditing es verdadero...
      then: (schema) => schema.notRequired(),  // ...el banner NO es requerido
      otherwise: (schema) => schema.required("Debes subir una imagen"), // Si no (es nuevo), SÍ es requerido
    }),

  archivo_pdf: Yup.mixed()
    .nullable()
    .test("fileType", "Solo se permiten archivos PDF", (value) =>
      value ? value.type === "application/pdf" : true
    ),

  fecha_inicio: Yup.date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .typeError("La fecha de inicio no es válida"),

  fecha_fin: Yup.date()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .typeError("La fecha de finalización no es válida"),
});

