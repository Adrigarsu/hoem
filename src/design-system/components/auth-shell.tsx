import type { ReactNode } from "react";

type AuthShellProps = {
  // The brand panel, shown beside the page from the lg breakpoint (sign-in.md, "Layout — desktop").
  panel: ReactNode;
  children: ReactNode;
};

// The frame of sign-in, sign-up and check-your-inbox: one column on phones; on desktop a brand
// panel on the left and the same column centred on the right. The panel sits outside <main>: it
// repeats the brand, it is not the page.
export function AuthShell({ panel, children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="hidden flex-1 flex-col justify-between gap-12 bg-brand p-12 text-on-brand lg:flex">
        {panel}
      </div>
      <main className="flex flex-1 flex-col px-6 pb-8 lg:items-center lg:justify-center lg:py-12">
        <div className="flex w-full flex-1 flex-col lg:max-w-column-narrow lg:flex-none">
          {children}
        </div>
      </main>
    </div>
  );
}
