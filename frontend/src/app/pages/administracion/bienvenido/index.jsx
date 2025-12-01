// administración/bienvenido/index.jsx

import { useAuthContext } from "app/contexts/auth/context";

export default function Bienvenido() {
    const { user, role } = useAuthContext();

    console.log("🧪 Bienvenido => user:", user, "role:", role);

    if (!user) return null;

    const roleLabels = {
        superadmin: "superadministrador",
        admin: "administrador",
        responsable: "responsable",
        usuario: "usuario",
    };

    const roleDisplay = roleLabels[role] || role;

    return (
        <div className="px-4 text-[clamp(2.2rem,3.75vw,3.75rem)] font-medium leading-[1.1] tracking-tight">
            <span
                style={{
                    animationDuration: "5s",
                    backgroundSize: "200% 100%",
                }}
                className="block animate-shimmer bg-linear-to-r from-blue-900 via-blue-400 to-rose-950 bg-clip-text font-semibold text-transparent"
            >
                ¡Bienvenido {roleDisplay} {user.first_name}!

            </span>
        </div>
    );
}
