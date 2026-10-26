import { AppShell } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return <AppShell>{children}</AppShell>;
}
