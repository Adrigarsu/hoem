import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, Tooltip } from "@/design-system";
import { ownProfile } from "@/features/profile";
import { NavLink } from "./nav-link";

const settings = "/settings";

// Fixed at the top right on phones (FR-NAV-001); pages keep that corner free.
export async function AvatarFab() {
  const profile = await ownProfile();
  return <AvatarFabLink name={profile.displayName} />;
}

function AvatarFabLink({ name }: { name: string }) {
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
            <Avatar name={name} />
          </span>
        </NavLink>
      </Tooltip>
    </div>
  );
}

// At the bottom of the sidebar on wider screens.
export async function SidebarProfile() {
  const profile = await ownProfile();
  return <SidebarProfileLink name={profile.displayName} />;
}

function SidebarProfileLink({ name }: { name: string }) {
  const t = useTranslations("Shell");
  return (
    <NavLink
      href={settings}
      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-text hover:bg-surface-subtle aria-[current=page]:border-brand aria-[current=page]:bg-brand-tint aria-[current=page]:text-brand-ink"
    >
      <Avatar name={name} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label">{name}</span>
        <span className="text-caption">{t("profileAndSettings")}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
    </NavLink>
  );
}
