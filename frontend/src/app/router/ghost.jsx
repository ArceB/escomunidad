import GhostGuard from "middleware/GhostGuard";

const ghostRoutes = {

  
  id: "ghost",
  Component: GhostGuard,
  children: [
    {
      path: "escomunidad-admin-panel",
      lazy: async () => ({
        Component: (await import("app/pages/Auth")).default,
      }),
    },
    {
      path: "principal",
      lazy: async () => ({
        Component: (await import("app/pages/dashboards/principal")).default,
      }),
    },
    {
      path: "crear-contraseña/:token",
      lazy: async () => ({
        Component: (await import("app/pages/Auth/crear-contrasena")).default,
      }),
    },
  ],
};

export { ghostRoutes };
