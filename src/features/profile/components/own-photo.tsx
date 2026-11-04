"use client";

import { useTranslations } from "next-intl";
import { createContext, startTransition, use, useState, type ReactNode } from "react";
import { Avatar, Toast, useUndoTimer } from "@/design-system";
import { removePhotoAction } from "../actions";

type Notice = "removed" | "removeFailed";

type OwnPhoto = {
  hidden: boolean;
  notice: Notice | null;
  remove: () => void;
  // Also when a new photo is chosen: the removal still waiting would otherwise delete it.
  undo: () => void;
  pause: () => void;
  resume: () => void;
};

const noop = () => undefined;

// Outside the provider nothing can be removed, so the photo is simply shown.
const OwnPhotoContext = createContext<OwnPhoto>({
  hidden: false,
  notice: null,
  remove: noop,
  undo: noop,
  pause: noop,
  resume: noop,
});

// The user's photo is drawn by several Server Components (header, sidebar, settings), which only
// change once the server has deleted it. Holding the removal here, around every signed-in page,
// hides the photo everywhere at once and keeps the 5-second undo across navigation (FR-ACC-007,
// ADR-009).
export function OwnPhotoProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useUndoTimer();

  function commit() {
    setNotice(null);
    startTransition(async () => {
      const { removed } = await removePhotoAction();
      // In the same transition as the refreshed layout, so the photo never flashes back.
      startTransition(() => setHidden(false));
      if (removed) return;
      setNotice("removeFailed");
      timer.start(() => setNotice(null));
    });
  }

  const value: OwnPhoto = {
    hidden,
    notice,
    remove() {
      setHidden(true);
      setNotice("removed");
      timer.start(commit);
    },
    undo() {
      timer.undo();
      setHidden(false);
      setNotice(null);
    },
    pause: timer.pause,
    resume: timer.resume,
  };

  return <OwnPhotoContext value={value}>{children}</OwnPhotoContext>;
}

export function useOwnPhoto() {
  return use(OwnPhotoContext);
}

type OwnAvatarProps = { name: string; src: string | null; size?: "md" | "lg" };

// The signed-in user's own avatar: the initials while their photo is being removed.
export function OwnAvatar({ name, src, size }: OwnAvatarProps) {
  const { hidden } = useOwnPhoto();
  return <Avatar name={name} src={hidden ? null : src} size={size} />;
}

// Placed by the shell above the tab bar, so it never covers the navigation.
export function OwnPhotoToast() {
  const t = useTranslations("Profile.photo");
  const { notice, undo, pause, resume } = useOwnPhoto();
  return (
    <Toast
      message={notice && t(notice)}
      tone={notice === "removeFailed" ? "alert" : "status"}
      action={notice === "removed" ? { label: t("undo"), onClick: undo } : undefined}
      onPause={pause}
      onResume={resume}
    />
  );
}
