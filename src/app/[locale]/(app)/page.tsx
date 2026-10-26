import { Home } from "@/features/home";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

// Only signed-in users reach it (src/proxy.ts).
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return <Home />;
}
