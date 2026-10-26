import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { familyRole, householdType } from "@/db/schema";
import {
  defaultSettings,
  familyRoles,
  householdTypes,
  type HouseholdSettings,
} from "./domain/household-rules";
import { householdSettingsSchema, householdSettingsSchemaFor } from "./schemas";

describe("householdSettingsSchema", () => {
  it.each(["single", "family", "shared_flat", "other"] as const)(
    "FR-HH-001 accepts the default settings of a %s household",
    (type) => {
      expect(householdSettingsSchema.safeParse(defaultSettings(type)).success).toBe(true);
    },
  );

  it("FR-HH-001 rejects keys it does not know", () => {
    const result = householdSettingsSchema.safeParse({
      ...defaultSettings("shared_flat"),
      ownersSeeEverything: true,
    });
    expect(result.success).toBe(false);
  });

  it("FR-HH-001 rejects a value outside the options", () => {
    const result = householdSettingsSchema.safeParse({
      ...defaultSettings("shared_flat"),
      privateExpenses: "everyone",
    });
    expect(result.success).toBe(false);
  });

  it("FR-HH-009 needs to know whether family splitting is enabled", () => {
    const result = householdSettingsSchema.safeParse({
      ...defaultSettings("family"),
      splitting: { mode: "between_parents" },
    });
    expect(result.success).toBe(false);
  });

  it("FR-HH-001 rejects the empty settings a household row starts with", () => {
    expect(householdSettingsSchema.safeParse({}).success).toBe(false);
  });
});

describe("householdSettingsSchemaFor", () => {
  it("FR-HH-001 names the field that does not fit the household type", () => {
    const result = householdSettingsSchemaFor("other").safeParse({
      ...defaultSettings("other"),
      roles: "family",
    });
    expect(result.error?.issues.map(({ path, message }) => [path.join("."), message])).toEqual([
      ["roles", "notAllowedForType"],
    ]);
  });

  it("FR-ONB-003 refuses a household without any meal slot", () => {
    const result = householdSettingsSchemaFor("single").safeParse({
      ...defaultSettings("single"),
      mealSlots: [],
    });
    expect(result.error?.issues.map(({ path, message }) => [path.join("."), message])).toEqual([
      ["mealSlots", "required"],
    ]);
  });

  it("FR-ONB-003 refuses the same meal slot twice", () => {
    const result = householdSettingsSchemaFor("single").safeParse({
      ...defaultSettings("single"),
      mealSlots: ["lunch", "lunch"],
    });
    expect(result.error?.issues.map(({ path, message }) => [path.join("."), message])).toEqual([
      ["mealSlots", "duplicateMealSlot"],
    ]);
  });

  it("FR-MEAL-007 stores the meal slots in the order of the day", () => {
    const result = householdSettingsSchemaFor("single").parse({
      ...defaultSettings("single"),
      mealSlots: ["dinner", "breakfast"],
    });
    expect(result.mealSlots).toEqual(["breakfast", "dinner"]);
  });
});

describe("householdSettingsSchema and HouseholdSettings", () => {
  it("FR-HH-001 describe the same values", () => {
    expectTypeOf<z.infer<typeof householdSettingsSchema>>().toEqualTypeOf<HouseholdSettings>();
  });
});

describe("household types and family roles", () => {
  it("FR-HH-001 match the database enums", () => {
    expect([...householdTypes]).toEqual(householdType.enumValues);
    expect([...familyRoles]).toEqual(familyRole.enumValues);
  });
});
