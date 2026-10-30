import { ChevronDown, CircleAlert } from "lucide-react";
import { useId, type Ref, type SelectHTMLAttributes } from "react";

export type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  // Optional: a select that drives a dialog instead of a form, such as the household type, has none.
  name?: string;
  options: readonly { value: string; label: string }[];
  // An empty first option, such as "Choose a role", for a choice nobody has made yet.
  placeholder?: string;
  help?: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
};

// A native select, so keyboard, screen readers and phones use their own picker. Label, help and
// error are linked like in TextField; a disabled select keeps its help, which says why.
export function SelectField({
  label,
  options,
  placeholder,
  help,
  error,
  id,
  className = "",
  ref,
  ...select
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const helpId = help ? `${selectId}-help` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={selectId} className="text-label text-text">
        {label}
      </label>
      <div className="relative flex">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-control-height w-full cursor-pointer appearance-none rounded-md border border-border-control bg-surface pr-10 pl-4 text-body text-text disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle disabled:text-text-muted aria-invalid:border-danger"
          {...select}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-icon-md -translate-y-1/2 text-text-secondary"
          strokeWidth={1.5}
        />
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
