import { AuthShell } from "@/design-system";
import { BrandPanel } from "@/features/auth";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  await setLocaleFromParams(params);
  return <AuthShell panel={<BrandPanel />}>{children}</AuthShell>;
}
