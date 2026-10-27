import { useTranslations } from "next-intl";
import { Suspense, type ReactNode } from "react";
import { AvatarFab } from "./profile-entries";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";

// Every signed-in page (FR-NAV-001). In the DOM the skip link comes first, then the navigation of
// the current width, then the content, so the keyboard order follows what is on screen.
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Shell");
  return (
    <div className="flex min-h-dvh flex-col md:pl-sidebar-width">
      <a
        href="#main"
        className="sr-only z-30 rounded-md bg-surface px-4 py-3 text-label text-text focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        {t("skipToContent")}
      </a>
      <Sidebar />
      <Suspense>
        <AvatarFab />
      </Suspense>
      <main id="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
