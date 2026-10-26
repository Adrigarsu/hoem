import type { ReactNode } from "react";

type PageProps = {
  // The h1 and anything under it, such as the date on Home.
  title: ReactNode;
  // Next to the title, such as the Notifications bell.
  actions?: ReactNode;
  children: ReactNode;
};

// The content column of a signed-in page. On phones the header leaves the top right corner to the
// avatar button.
export function Page({ title, actions, children }: PageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-6 md:gap-6 md:px-10 md:pt-8 md:pb-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {actions && (
          <div className="flex justify-end gap-3 pr-12 md:order-last md:pr-0">{actions}</div>
        )}
        <div className={actions ? undefined : "pr-12 md:pr-0"}>{title}</div>
      </header>
      {children}
    </div>
  );
}
