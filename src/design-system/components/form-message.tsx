import { CircleAlert, CircleCheck, type LucideIcon } from "lucide-react";
import type { ReactNode, Ref } from "react";

const tones: Record<
  "danger" | "success",
  { icon: LucideIcon; role: "alert" | "status"; classes: string }
> = {
  // Errors interrupt (role=alert); confirmations wait for a pause (role=status).
  danger: { icon: CircleAlert, role: "alert", classes: "bg-danger-tint text-danger-ink" },
  success: { icon: CircleCheck, role: "status", classes: "bg-success-tint text-success-ink" },
};

type FormMessageProps = {
  tone: keyof typeof tones;
  children: ReactNode;
  // An action that belongs to the message, such as "Resend the link".
  action?: ReactNode;
  // Lets a form move focus here after a failed submit; tabIndex -1 makes it focusable by script only.
  ref?: Ref<HTMLDivElement>;
};

// A message about the whole form. Tint and ink are an approved colour pair; the icon and the text
// carry the meaning, so colour is never the only signal (NFR-A11Y-005).
export function FormMessage({ tone, children, action, ref }: FormMessageProps) {
  const { icon: Icon, role, classes } = tones[tone];
  return (
    <div
      ref={ref}
      role={role}
      tabIndex={-1}
      className={`flex flex-col gap-3 rounded-md p-4 text-small ${classes}`}
    >
      <p className="flex items-start gap-2">
        {/* As tall as one line of text, so the icon lines up with the first line. */}
        <span className="flex h-5 shrink-0 items-center">
          <Icon aria-hidden="true" className="size-icon-sm" strokeWidth={1.5} />
        </span>
        <span>{children}</span>
      </p>
      {action}
    </div>
  );
}
