import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  help?: string;
  error?: string;
  // Rendered inside the field, after the input (the password visibility toggle).
  trailing?: ReactNode;
};

// Label, help and error are linked to the input with htmlFor and aria-describedby, so a screen
// reader reads them with the field; the error also carries an icon, not colour alone.
export function TextField({
  label,
  help,
  error,
  trailing,
  id,
  className = "",
  ...input
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label text-text">
        {label}
      </label>
      <div className="flex gap-2">
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
        <p id={helpId} className="text-small text-text-secondary">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-small font-medium text-danger">
          <CircleAlert aria-hidden="true" className="size-icon-sm shrink-0" strokeWidth={1.5} />
          {error}
        </p>
      )}
    </div>
  );
}
