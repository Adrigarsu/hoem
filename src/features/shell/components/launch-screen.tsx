"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Logo, ProgressBar } from "@/design-system";

// Shown while a signed-in page is still loading, and gone as soon as it is ready, with no minimum
// time (FR-NAV-004). It fills the content area and leaves the navigation usable, so a slow
// navigation never hides it or traps focus under a cover. A div, not a main: it renders inside
// the shell's main. A client component: loading.tsx gets no params, so on the server next-intl
// could only find the locale in the request headers, which would make every signed-in page
// dynamic; the client provider of the locale layout already has it.
export function LaunchScreen() {
  const t = useTranslations("Splash");
  const tMetadata = useTranslations("Metadata");
  // Screen readers announce a live region when its content changes, not when it arrives already
  // filled, so the status gets its text once it is on the page.
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnnouncement(t("loading")));
    return () => cancelAnimationFrame(frame);
  }, [t]);
  return (
    <div
      aria-busy="true"
      className="flex flex-1 flex-col items-center justify-center gap-6 bg-brand px-4 py-16"
    >
      {/* WCAG 2.4.2: Next.js empties the title until the new page's metadata arrives. React
          hoists this one into the head while the launch screen is shown. */}
      <title>{tMetadata("title")}</title>
      <Logo label={tMetadata("title")} tone="on-brand" className="h-12" />
      <div className="flex flex-col items-center gap-3">
        <ProgressBar />
        <p aria-hidden="true" className="text-small text-brand-tint">
          {t("loading")}
        </p>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
    </div>
  );
}
