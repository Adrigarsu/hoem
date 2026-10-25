import { HomeHeading } from "@/features/home";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

// Placeholder until the dashboard exists (#13).
export default async function Home({ params }: PageProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <HomeHeading />
    </main>
  );
}
