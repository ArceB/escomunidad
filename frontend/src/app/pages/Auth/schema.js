import * as Yup from 'yup'

export const schema = Yup.object().shape({
    username: Yup.string()
        .trim()
        .required('El nombre de usuario es obligatorio'),
    password: Yup.string().trim()
        .required('La contraseña es obligatoria'),
})