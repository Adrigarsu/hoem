import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  help?: string;
  error?: string;
  // Rendered inside the field, after the input (the password visibility toggle).
  trailing?: ReactNode;
  // Beside the label, outside it, so it does not become part of the field's name ("Forgot
  // password?").
  labelAction?: ReactNode;
};

// Label, help and error are linked to the input with htmlFor and aria-describedby, so a screen
// reader reads them with the field; the error also carries an icon, not colour alone.
export function TextField({
  label,
  help,
  error,
  trailing,
  labelAction,
  id,
  className = "",
  ...input
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  // labelAction comes last in the DOM, so the tab order is field → action, while `order` shows it
  // beside the label (the screens draw "Forgot password?" there).
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <label htmlFor={inputId} className="order-1 text-label text-text">
        {label}
      </label>
      <div className="order-3 flex w-full gap-2">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-control-height min-w-0 flex-1 rounded-md border border-border-control bg-surface px-4 text-body text-text placeholder:text-text-muted aria-invalid:border-danger ${className}`}
          {...input}
        />
        {trailing}
      </div>
      {help && (
        <p id={helpId} className="order-4 w-full text-small text-text-secondary">
          {help}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="order-5 flex w-full items-center gap-1 text-small font-medium text-danger"
        >
          <CircleAlert aria-hidden="true" className="size-icon-sm shrink-0" strokeWidth={1.5} />
          {error}
        </p>
      )}
      {labelAction && <div className="order-2">{labelAction}</div>}
    </div>
  );
}
