import { setLocaleFromParams } from "@/lib/i18n/locale-param";

// Sign-in and sign-up: one card, centred, readable from 360 px wide.
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
        {children}
      </div>
    </main>
  );
}
