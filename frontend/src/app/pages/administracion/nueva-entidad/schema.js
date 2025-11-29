import * as Yup from "yup";

export const schema = Yup.object().shape({
  nombre: Yup.string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(50, "El nombre es muy largo")
    .required("El nombre es obligatorio"),

  correo: Yup.string()
    .email("Debe ser un correo válido")
<<<<<<< Updated upstream
    .required("El correo es obligatorio"),
  telefono: Yup.string()
    .matches(/^[0-9+\s-]{7,15}$/, "Número de teléfono inválido")
    .required("El teléfono es obligatorio"),
=======
    .nullable(),

  telefono: Yup.string()
    .nullable()
    .test(
      "telefono-valido",
      "Número de teléfono inválido",
      (value) => !value || /^[0-9+\s-]{7,15}$/.test(value)
    ),

>>>>>>> Stashed changes
  responsable_id: Yup.string().required("Seleccione un responsable"),

  usuarios: Yup.array()
    .of(Yup.string())
    .min(1, "Debe seleccionar al menos un usuario"),
  cover: Yup.mixed()
    .nullable()
    .test(
      "fileSize",
      "El archivo no debe superar 4MB",
      (value) => {
        if (!value) return true; // Si no hay imagen, la validación pasa
        return value.size <= 4194304; // Si hay imagen, revisamos el peso
      }
    ),
<<<<<<< Updated upstream
});
=======

  descripcion: Yup.mixed()
    .test("es-delta", "La descripción no es válida", (value) => !!value)
    .nullable(),
});
>>>>>>> Stashed changes
