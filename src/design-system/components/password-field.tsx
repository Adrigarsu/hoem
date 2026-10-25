"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { TextField, type TextFieldProps } from "./text-field";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing"> & {
  // Accessible name of the toggle, from the messages file.
  showLabel: string;
};

// The password is hidden by default; the toggle lets people check what they typed instead of
// retyping it. Pasting is never blocked, so password managers work (WCAG 3.3.8).
export function PasswordField({ showLabel, ...field }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...field}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          aria-label={showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="inline-grid size-control-height shrink-0 place-items-center rounded-md border border-border-control bg-surface text-text hover:bg-surface-subtle"
        >
          <Icon aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        </button>
      }
    />
  );
}
