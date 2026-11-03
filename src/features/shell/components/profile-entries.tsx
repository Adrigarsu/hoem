import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, Tooltip } from "@/design-system";
import { ownProfile, ThemeSync } from "@/features/profile";
import { settingsPaths } from "@/features/settings";
import { NavLink } from "./nav-link";

const settings = settingsPaths.settings;

// Fixed at the top right on phones (FR-NAV-001); pages keep that corner free.
export async function AvatarFab() {
  const profile = await ownProfile();
  return <AvatarFabLink name={profile.displayName} photo={profile.avatarUrl} />;
}

function AvatarFabLink({ name, photo }: { name: string; photo: string | null }) {
  const t = useTranslations("Shell");
  return (
    <div className="fixed top-4 right-4 z-20 md:hidden">
      <Tooltip label={t("profileAndSettings")} align="end">
        <NavLink
          href={settings}
          className="grid size-control-height place-items-center rounded-full"
        >
          <span className="sr-only">{t("profileAndSettings")}</span>
          <span className="rounded-full ring-2 ring-bg outline-1 outline-offset-2 outline-border-control">
            <Avatar name={name} src={photo} />
          </span>
        </NavLink>
      </Tooltip>
    </div>
  );
}

// At the bottom of the sidebar on wider screens.
export async function SidebarProfile() {
  const profile = await ownProfile();
  return <SidebarProfileLink name={profile.displayName} photo={profile.avatarUrl} />;
}

function SidebarProfileLink({ name, photo }: { name: string; photo: string | null }) {
  const t = useTranslations("Shell");
  return (
    <NavLink
      href={settings}
      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-text hover:bg-surface-subtle aria-[current=page]:border-brand aria-[current=page]:bg-brand-tint aria-[current=page]:text-brand-ink"
    >
      <Avatar name={name} src={photo} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label">{name}</span>
        <span className="text-caption">{t("profileAndSettings")}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
    </NavLink>
  );
}

// Brings this device in line when the theme was changed on another one (FR-ACC-007).
export async function ProfileTheme() {
  const profile = await ownProfile();
  return <ThemeSync theme={profile.theme} />;
}
