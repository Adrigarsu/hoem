"use client";

import { useTranslations } from "next-intl";
import { createContext, startTransition, use, useRef, useState, type ReactNode } from "react";
import { Avatar, Toast, useUndoTimer } from "@/design-system";
import { removePhotoAction } from "../actions";

type Notice = "removed" | "removeFailed";

type OwnPhoto = {
  hidden: boolean;
  notice: Notice | null;
  remove: () => void;
  // Also when a new photo is chosen: the removal still waiting would otherwise delete it.
  undo: () => void;
  // Resolves once a removal already sent has finished, so a new photo is not uploaded under it.
  settled: () => Promise<void>;
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
  settled: async () => undefined,
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
  const removal = useUndoTimer();
  // Separate from the removal, so dismissing a message is never mistaken for committing a delete.
  const dismissal = useUndoTimer();
  const sent = useRef<Promise<void>>(Promise.resolve());

  function commit() {
    setNotice(null);
    sent.current = new Promise<void>((resolve) => {
      startTransition(async () => {
        const { removed } = await removePhotoAction();
        // In the same transition as the refreshed layout, so the photo never flashes back.
        startTransition(() => setHidden(false));
        if (!removed) {
          setNotice("removeFailed");
          dismissal.start(() => setNotice(null));
        }
        resolve();
      });
    });
    return sent.current;
  }

  const value: OwnPhoto = {
    hidden,
    notice,
    remove() {
      dismissal.undo();
      setHidden(true);
      setNotice("removed");
      removal.start(commit);
    },
    undo() {
      removal.undo();
      setHidden(false);
      setNotice(null);
    },
    settled: () => sent.current,
    pause() {
      removal.pause();
      dismissal.pause();
    },
    resume() {
      removal.resume();
      dismissal.resume();
    },
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
      tone={notice === "removeFailed" ? "danger" : "success"}
      action={notice === "removed" ? { label: t("undo"), onClick: undo } : undefined}
      onPause={pause}
      onResume={resume}
    />
  );
}
