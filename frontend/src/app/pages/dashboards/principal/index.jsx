// app/pages/dashboards/principal/index.jsx

import { Page } from "components/shared/Page";
import { Banner } from "./Banner";
import { Conversation } from "app/pages/apps/ai-chat/Conversation";
import { Footer as ChatFooter } from "app/pages/apps/ai-chat/Footer";
import { ChatProvider } from "app/pages/apps/ai-chat/ChatProvider";
import NavBar from "app/layouts/MainLayout/NavBar";
import { useEffect } from "react";

export default function PrincipalPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Page title="Principal">
      <div className="w-full fixed top-0 left-0 z-50">
        <NavBar />
      </div>

      <main className="pt-[65px] min-h-screen flex flex-col items-center bg-gray-50 dark:bg-dark-900 space-y-10 [overflow-anchor:none]">
        {/* Banner */}
        <section className="w-full">
          <Banner />
        </section>

        {/* Chat IA */}
        <section className="w-full max-w-6xl flex flex-col rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 shadow-sm p-4">
          <div className="flex flex-col flex-1 h-[600px]">
            <ChatProvider>
              <div className="flex-1 overflow-hidden">
                <Conversation />
              </div>
              <div className="border-t border-gray-200 dark:border-dark-700 pt-2 mt-2">
                <ChatFooter />
              </div>
            </ChatProvider>
          </div>
        </section>
      </main>
    </Page>
  );
}

