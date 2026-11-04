import { useTranslations } from "next-intl";
import { Suspense, type ReactNode } from "react";
import { OwnPhotoProvider, OwnPhotoToast } from "@/features/profile";
import { AvatarFab, ProfileTheme } from "./profile-entries";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";

// Every signed-in page (FR-NAV-001). In the DOM the skip link comes first, then the navigation of
// the current width, then the content, so the keyboard order follows what is on screen. The toast
// sticks to the bottom together with the tab bar, so it sits right above it and never covers it.
export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Shell");
  return (
    <OwnPhotoProvider>
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
          <ProfileTheme />
        </Suspense>
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </main>
        <div className="sticky bottom-0 z-10">
          <OwnPhotoToast />
          <TabBar />
        </div>
      </div>
    </OwnPhotoProvider>
  );
}
