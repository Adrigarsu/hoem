type SegmentedControlProps<Value extends string> = {
  // The accessible name of the group.
  label: string;
  name: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
};

// One choice among a few, side by side (profile.md, "Theme"). Real radio inputs, so arrow keys move
// the selection. The selected segment gets a raised surface, an edge and a stronger label, so colour
// is not the only signal. Segments are 44 px tall: profile.html draws 36, under the touch target rule.
export function SegmentedControl<Value extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-1 rounded-lg border border-border bg-surface-subtle p-1"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="flex h-control-height flex-1 cursor-pointer items-center justify-center rounded-md border border-transparent px-3 text-label text-text-secondary has-checked:border-border-control has-checked:bg-surface has-checked:font-bold has-checked:text-text has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
