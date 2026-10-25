import { SignOutButton } from "@/features/auth";
import { HomeHeading } from "@/features/home";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

// Placeholder until the dashboard exists. Only signed-in users reach it (src/proxy.ts).
export default async function Home({ params }: PageProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <HomeHeading />
      <SignOutButton />
    </main>
  );
}
