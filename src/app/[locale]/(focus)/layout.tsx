import { setLocaleFromParams } from "@/lib/i18n/locale-param";

// Signed-in pages that take the whole screen, without the app shell: creating a household now and
// the setup guide later (new-household.md, setup-welcome.md). The proxy keeps them behind sign-in.
export default async function FocusLayout({ children, params }: LayoutProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-column flex-col px-6 pt-6 md:pt-16 md:pb-8"
    >
      {children}
    </main>
  );
}
