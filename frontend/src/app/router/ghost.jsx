import GhostGuard from "middleware/GhostGuard";

const ghostRoutes = {
  id: "ghost",
  Component: GhostGuard,
  children: [
    {
      path: "login",
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
        Component: (await import("app/pages/auth/crear-contraseña")).default,
      }),
    },
  ],
};

export { ghostRoutes };
