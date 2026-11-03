"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { FormMessage, SegmentedControl } from "@/design-system";
import { applyTheme, themes, type Theme } from "@/lib/theme/theme";
import { saveThemeAction } from "../actions";

// Appearance (FR-ACC-007, profile.md). The theme changes at once and is saved in the background; if
// saving fails, the last saved theme comes back and the message says so.
export function ThemeForm({ theme, titled = true }: { theme: Theme; titled?: boolean }) {
  const t = useTranslations("Profile.theme");
  const tTheme = useTranslations("Settings.theme");
  const [selected, setSelected] = useState(theme);
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [, startSaving] = useTransition();
  // What the profile holds, and which choice is the newest: arrow keys send one save per step.
  const savedTheme = useRef(theme);
  const latestChoice = useRef(0);

  function choose(next: Theme) {
    latestChoice.current += 1;
    const choice = latestChoice.current;
    setSelected(next);
    setStatus("idle");
    applyTheme(next);
    startSaving(async () => {
      // Rejects when the request never reaches the server, such as when offline.
      const saved = await saveThemeAction(next).then(
        (result) => result.saved,
        () => false,
      );
      if (saved) savedTheme.current = next;
      if (choice !== latestChoice.current) return;
      if (saved) {
        setStatus("saved");
        return;
      }
      setSelected(savedTheme.current);
      applyTheme(savedTheme.current);
      setStatus("failed");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {/* On its own page the h1 already says it. */}
        {titled && <p className="text-body-strong text-text">{t("title")}</p>}
        <p className="text-small text-text-secondary">{t("help")}</p>
      </div>
      <SegmentedControl
        label={t("label")}
        name="theme"
        options={themes.map((value) => ({ value, label: tTheme(value) }))}
        value={selected}
        onChange={choose}
      />
      {/* In the page from the start, so a screen reader announces the change of text. */}
      <p role="status" className="text-small text-text-secondary">
        {status === "saved" && t("saved")}
      </p>
      {status === "failed" && <FormMessage tone="danger">{t("failed")}</FormMessage>}
    </div>
  );
}
