import { describe, expect, it } from "vitest";
import {
  defaultSettings,
  privateExpenseVisibleToParents,
  settingsAfterTypeChange,
  settingsMisfits,
  type HouseholdSettings,
} from "./household-rules";

describe("defaultSettings", () => {
  it.each([
    [
      "single",
      {
        roles: "owner_only",
        privateShoppingLists: false,
        splitting: { mode: "off" },
        mealPlan: "personal",
        privateExpenses: "creator",
        mealSlots: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"],
      },
    ],
    [
      "family",
      {
        roles: "family",
        privateShoppingLists: true,
        splitting: { mode: "between_parents", enabled: false },
        mealPlan: "shared_only",
        privateExpenses: "creator_and_parents_for_children",
        mealSlots: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"],
      },
    ],
    [
      "shared_flat",
      {
        roles: "owner_or_member",
        privateShoppingLists: true,
        splitting: { mode: "each_member" },
        mealPlan: "shared_and_private",
        privateExpenses: "creator",
        mealSlots: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"],
      },
    ],
  ] as const)(
    "FR-HH-001 gives a new %s household its default roles, lists, splitting and meal plan",
    (type, expected) => {
      expect(defaultSettings(type)).toEqual(expected);
    },
  );

  it('FR-HH-001 starts an "other" household with the shared-flat settings', () => {
    expect(defaultSettings("other")).toEqual(defaultSettings("shared_flat"));
  });

  it("FR-HH-001 returns a fresh copy, so changing one household cannot change the defaults", () => {
    const settings = defaultSettings("family");
    settings.privateShoppingLists = false;
    expect(defaultSettings("family").privateShoppingLists).toBe(true);
  });
});

describe("privateExpenseVisibleToParents", () => {
  const family = defaultSettings("family");

  it("FR-HH-002 makes a child's private expense visible to the parents", () => {
    expect(privateExpenseVisibleToParents(family, "child")).toBe(true);
  });

  it("FR-HH-002 keeps a parent's private expense to its creator", () => {
    expect(privateExpenseVisibleToParents(family, "parent")).toBe(false);
  });

  it("FR-HH-008 keeps a relative's private expense to its creator", () => {
    expect(privateExpenseVisibleToParents(family, "relative")).toBe(false);
  });

  it("FR-HH-004 keeps a member's private expense to its creator in a shared flat, owners included", () => {
    expect(privateExpenseVisibleToParents(defaultSettings("shared_flat"), null)).toBe(false);
  });

  it("FR-HH-001 keeps a private expense to its creator in a single household", () => {
    expect(privateExpenseVisibleToParents(defaultSettings("single"), null)).toBe(false);
  });

  it("FR-HH-007 follows the settings, not the type: a rule set to creator hides even a child's", () => {
    expect(privateExpenseVisibleToParents({ ...family, privateExpenses: "creator" }, "child")).toBe(
      false,
    );
  });
});

describe("settingsMisfits", () => {
  it.each(["single", "family", "shared_flat", "other"] as const)(
    "FR-HH-001 accepts the defaults of a %s household",
    (type) => {
      expect(settingsMisfits(type, defaultSettings(type))).toEqual([]);
    },
  );

  it("FR-HH-009 lets the parents enable family splitting", () => {
    const settings = {
      ...defaultSettings("family"),
      splitting: { mode: "between_parents", enabled: true },
    } as const;
    expect(settingsMisfits("family", settings)).toEqual([]);
  });

  it("FR-ONB-003 lets a household choose the meal slots it uses", () => {
    const settings: HouseholdSettings = {
      ...defaultSettings("single"),
      mealSlots: ["lunch", "dinner"],
    };
    expect(settingsMisfits("single", settings)).toEqual([]);
  });

  it("FR-HH-001 refuses another type's rules in a fixed type, such as private records for owners in a shared flat", () => {
    const settings = {
      ...defaultSettings("shared_flat"),
      privateExpenses: "creator_and_parents_for_children",
    } as const;
    expect(settingsMisfits("shared_flat", settings)).toEqual(["privateExpenses"]);
  });

  it("FR-HH-002 refuses a family whose parents cannot see a child's private expenses", () => {
    const settings = { ...defaultSettings("family"), privateExpenses: "creator" } as const;
    expect(settingsMisfits("family", settings)).toEqual(["privateExpenses"]);
  });

  it('FR-HH-010 lets an "other" household pick options other types use', () => {
    const settings = {
      ...defaultSettings("other"),
      privateShoppingLists: false,
      splitting: { mode: "off" },
      mealPlan: "shared_only",
    } as const;
    expect(settingsMisfits("other", settings)).toEqual([]);
  });

  it.each([
    ["family roles", { roles: "family" }, "roles"],
    ["a single person", { roles: "owner_only" }, "roles"],
    [
      "parents seeing private records",
      { privateExpenses: "creator_and_parents_for_children" },
      "privateExpenses",
    ],
    [
      "splitting between parents",
      { splitting: { mode: "between_parents", enabled: true } },
      "splitting",
    ],
  ] as const)(
    'FR-HH-010 refuses %s in an "other" household, which can have several members but no family roles',
    (_, change, field) => {
      expect(settingsMisfits("other", { ...defaultSettings("other"), ...change })).toEqual([field]);
    },
  );
});

describe("settingsAfterTypeChange", () => {
  it("FR-HH-007 gives a household the rules of its new type, so new records follow them", () => {
    const family = {
      ...defaultSettings("family"),
      splitting: { mode: "between_parents", enabled: true },
    } as const;
    expect(settingsAfterTypeChange("shared_flat", family)).toEqual(defaultSettings("shared_flat"));
  });

  it("FR-ONB-003 keeps the meal slots the household chose", () => {
    const single: HouseholdSettings = {
      ...defaultSettings("single"),
      mealSlots: ["lunch", "dinner"],
    };
    expect(settingsAfterTypeChange("family", single).mealSlots).toEqual(["lunch", "dinner"]);
  });
});
