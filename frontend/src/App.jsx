// Import Dependencies
import { RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";

// Local Imports
import { AuthProvider } from "app/contexts/auth/Provider";
import { BreakpointProvider } from "app/contexts/breakpoint/Provider";
import { LocaleProvider } from "app/contexts/locale/Provider";
import { SidebarProvider } from "app/contexts/sidebar/Provider";
import { ThemeProvider } from "app/contexts/theme/Provider";
import router from "app/router/router";
import FloatingChat from "app/pages/apps/ai-chat/FloatingChat";

// ----------------------------------------------------------------------

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ThemeProvider>
          <LocaleProvider>
            <BreakpointProvider>
              <SidebarProvider>
                <RouterProvider router={router} />
                <FloatingChat />
              </SidebarProvider>
            </BreakpointProvider>
          </LocaleProvider>
        </ThemeProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
