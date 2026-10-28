// Indeterminate progress on a brand background (splash.md). Hidden from assistive technology: the
// status text next to it is what is announced. Under reduced motion the indicator stays still.
export function ProgressBar() {
  return (
    <div
      aria-hidden="true"
      className="h-1 w-progress-width overflow-hidden rounded-full bg-on-brand/25"
    >
      <div className="h-full w-9/20 animate-progress rounded-full bg-on-brand motion-reduce:animate-none" />
    </div>
  );
}
