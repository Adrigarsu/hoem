"use client";

import { Check, ChevronDown, House, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { buttonClassName, IconButton } from "@/design-system";
import { switchHouseholdAction } from "../actions";
import type { HouseholdType } from "../domain/household-rules";
import { newHouseholdPath } from "../paths";

type HouseholdOption = { id: string; name: string; type: HouseholdType; memberCount: number };

type HouseholdMenuProps = {
  households: readonly HouseholdOption[];
  active: HouseholdOption;
  // header: the button in the Home header on phones, opening a bottom sheet. sidebar: the button
  // under the logo on wider screens, opening a menu below it (household-switcher.md).
  placement: "header" | "sidebar";
};

// The household switcher (FR-ACC-004), on the WAI-ARIA menu button pattern at every width: the
// households are menuitemradio, so the active one is announced as checked, and "Create a new
// household" is the last item. The arrow keys, Home and End move between items; Escape and Tab
// close the menu and return focus to the button.
export function HouseholdMenu({ households, active, placement }: HouseholdMenuProps) {
  const t = useTranslations("Households");
  const [open, setOpen] = useState(false);
  // The item to focus once the menu is on the page.
  const [focusIndex, setFocusIndex] = useState(0);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const activeIndex = Math.max(
    households.findIndex((household) => household.id === active.id),
    0,
  );
  const lastIndex = households.length;
  // The sidebar is narrow: smaller icons and padding keep "Shared flat · 2 members" on one line.
  const compact = placement === "sidebar";

  useEffect(() => {
    if (open) itemRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  // A click anywhere else closes the menu, leaving focus where the click put it.
  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function openAt(index: number) {
    setFocusIndex(index);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onButtonKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") openAt(activeIndex);
    else if (event.key === "ArrowUp") openAt(lastIndex);
    else return;
    event.preventDefault();
  }

  // Where a key moves focus from the current item, wrapping at both ends; null for other keys.
  function target(key: string, current: number): number | null {
    if (key === "ArrowDown") return current === lastIndex ? 0 : current + 1;
    if (key === "ArrowUp") return current <= 0 ? lastIndex : current - 1;
    if (key === "Home") return 0;
    if (key === "End") return lastIndex;
    return null;
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close();
      return;
    }
    const current = itemRefs.current.findIndex((item) => item === document.activeElement);
    const next = target(event.key, current);
    if (next === null) return;
    event.preventDefault();
    setFocusIndex(next);
    itemRefs.current[next]?.focus();
  }

  function choose(household: HouseholdOption) {
    if (switchingId) return;
    if (household.id === active.id) {
      close();
      return;
    }
    setSwitchingId(household.id);
    startTransition(async () => {
      await switchHouseholdAction(household.id);
      setSwitchingId(null);
      setAnnouncement(t("switcher.switchedTo", { name: household.name }));
      close();
    });
  }

  function meta(household: HouseholdOption) {
    const type = t(`types.${household.type}`);
    if (household.type === "single") return type;
    return `${type} · ${t("switcher.members", { count: household.memberCount })}`;
  }

  const menu = (
    <div
      role="menu"
      tabIndex={-1}
      aria-label={t("switcher.title")}
      aria-busy={switchingId !== null}
      onKeyDown={onMenuKeyDown}
      className="flex flex-col gap-2"
    >
      {households.map((household, index) => {
        const checked = household.id === active.id;
        return (
          <button
            key={household.id}
            ref={(item) => {
              itemRefs.current[index] = item;
            }}
            type="button"
            role="menuitemradio"
            aria-checked={checked}
            tabIndex={-1}
            onClick={() => choose(household)}
            className={`flex min-h-16 w-full items-center rounded-lg border py-2 text-left ${compact ? "gap-2 px-2" : "gap-3 px-3"} text-text transition-colors duration-fast ${
              checked
                ? "border-brand bg-brand-tint ring-1 ring-brand ring-inset"
                : "border-border bg-surface hover:bg-surface-subtle"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink ${compact ? "size-8" : "size-10"}`}
            >
              <House className="size-icon-md" strokeWidth={1.5} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-body-strong">{household.name}</span>
              <span className="text-small text-text-secondary">
                {switchingId === household.id ? t("switcher.switching") : meta(household)}
              </span>
            </span>
            {checked && (
              <Check aria-hidden="true" className="size-icon-md text-brand-ink" strokeWidth={1.5} />
            )}
          </button>
        );
      })}
      <Link
        ref={(item) => {
          itemRefs.current[lastIndex] = item;
        }}
        href={newHouseholdPath}
        role="menuitem"
        tabIndex={-1}
        className={
          compact
            ? "inline-flex min-h-control-height w-full items-center justify-center gap-2 rounded-md border border-border-control bg-surface px-3 text-label text-text transition-colors duration-fast hover:bg-surface-subtle"
            : `${buttonClassName("secondary")} w-full`
        }
      >
        <Plus aria-hidden="true" className="size-icon-md" strokeWidth={1.5} />
        {t("switcher.create")}
      </Link>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : openAt(activeIndex))}
        onKeyDown={onButtonKeyDown}
        className={
          placement === "header"
            ? "flex h-control-height max-w-full items-center gap-2 rounded-md border border-border-control bg-surface pr-3 pl-1 text-label text-text hover:bg-surface-subtle"
            : "flex w-full items-center gap-3 rounded-md border border-border-control bg-surface py-2 pr-3 pl-2 text-left text-text hover:bg-surface-subtle"
        }
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink"
        >
          <House className="size-icon-sm" strokeWidth={1.5} />
        </span>
        {placement === "header" ? (
          <span className="truncate">{active.name}</span>
        ) : (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label">{active.name}</span>
            <span className="text-caption text-text-secondary">{meta(active)}</span>
          </span>
        )}
        <ChevronDown aria-hidden="true" className="size-icon-sm shrink-0" strokeWidth={1.5} />
        <span className="sr-only">{t("switcher.switch")}</span>
      </button>

      {open && placement === "sidebar" && (
        <div className="absolute inset-x-0 top-full z-10 mt-2 rounded-lg border border-border bg-surface p-1">
          {menu}
        </div>
      )}
      {open && placement === "header" && (
        <div className="fixed inset-0 z-40">
          {/* Tapping the scrim closes the sheet; keyboard users have Escape and Tab. */}
          <div aria-hidden="true" className="absolute inset-0 bg-scrim" onClick={close} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 rounded-t-xl bg-surface px-5 pt-3 pb-8 text-text">
            <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-border-control" />
            <div className="flex items-center justify-between">
              <h2 className="text-subtitle">{t("switcher.title")}</h2>
              <IconButton icon={X} label={t("switcher.close")} tooltipAlign="end" onClick={close} />
            </div>
            {menu}
          </div>
        </div>
      )}
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
