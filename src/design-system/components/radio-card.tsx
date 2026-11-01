import type { InputHTMLAttributes } from "react";

type RadioCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  name: string;
  value: string;
  title: string;
  description: string;
};

// One choice of a fieldset drawn as a card (setup-household, new-household). It is a real radio
// input inside its label, so arrow keys move the selection and the whole card is the touch target.
// The selected card gets a thicker brand edge and a tint, and the radio itself shows the choice,
// so colour is not the only signal.
export function RadioCard({ title, description, className = "", ...input }: RadioCardProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 has-checked:border-brand has-checked:bg-brand-tint has-checked:outline-1 has-checked:-outline-offset-2 has-checked:outline-brand ${className}`}
    >
      <input type="radio" className="size-icon-md shrink-0 accent-brand" {...input} />
      <span className="flex flex-col">
        <span className="text-body-strong text-text">{title}</span>
        <span className="text-small text-text-secondary">{description}</span>
      </span>
    </label>
  );
}
