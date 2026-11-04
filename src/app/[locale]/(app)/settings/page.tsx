import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  DeleteAccountButton,
  DeleteAccountProvider,
  ownDeletionBlockers,
} from "@/features/account";
import { EmailForm, ownAccount, SignOutButton } from "@/features/auth";
import { currentHousehold } from "@/features/households";
import { AccountForm, LanguageField, ownProfile, ThemeForm } from "@/features/profile";
import { SettingsCards, SettingsMenu, settingsPaths } from "@/features/settings";
import { LaunchScreen, Page } from "@/features/shell";
import { setLocaleFromParams } from "@/lib/i18n/locale-param";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const locale = await setLocaleFromParams(params);
  const t = await getTranslations({ locale, namespace: "Settings" });
  return { title: t("title") };
}

// Profile and settings (FR-NAV-003, profile.md), opened from the avatar on phones and the sidebar
// on wider screens. The data loads inside <Suspense>: coming back from a settings page keeps the
// settings segment mounted, so the (app) loading screen does not cover that navigation.
export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = await setLocaleFromParams(params);
  return (
    <Suspense fallback={<LaunchScreen />}>
      <Settings locale={locale} />
    </Suspense>
  );
}

async function Settings({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Settings" });
  const [profile, account, households, blockers] = await Promise.all([
    ownProfile(),
    ownAccount(),
    // The same read as the sidebar switcher, so the households are queried once per request.
    currentHousehold().then(({ households }) => households),
    ownDeletionBlockers(),
  ]);

  return (
    <Page
      title={
        <div className="flex flex-col gap-2">
          {/* Wider screens keep the sidebar, so only phones need a way back. */}
          <Link
            href="/"
            className="-ml-3 inline-flex h-control-height items-center gap-1 self-start rounded-md px-3 text-label text-brand hover:bg-surface-subtle md:hidden"
          >
            <ChevronLeft aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
            {t("back")}
          </Link>
          <h1 className="text-title font-bold text-text md:text-heading">{t("title")}</h1>
          <p className="hidden text-body text-text-secondary md:block">{t("subtitle")}</p>
        </div>
      }
    >
      {/* One or the other by width, never both: a hidden block is out of the accessibility tree.
          Both share the one delete dialog, which lives outside them. The address comes from
          Supabase Auth, as in the Account card: the token may still have the old one. */}
      <DeleteAccountProvider email={account.email} blockers={blockers}>
        <SettingsMenu
          profile={{ ...profile, email: account.email }}
          households={households}
          locale={locale}
          signOut={<SignOutButton />}
          deleteAccount={<DeleteAccountButton />}
        />
        <SettingsCards
          households={households}
          account={
            <AccountForm
              profile={profile}
              email={<EmailForm account={account} passwordHref={settingsPaths.password} />}
            />
          }
          theme={<ThemeForm theme={profile.theme} />}
          language={<LanguageField locale={locale} />}
          signOut={<SignOutButton />}
          deleteAccount={<DeleteAccountButton />}
        />
      </DeleteAccountProvider>
    </Page>
  );
}
