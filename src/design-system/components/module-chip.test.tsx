import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ModuleChip } from "./module-chip";

describe("ModuleChip", () => {
  it.each(["meals", "shopping", "expenses"] as const)(
    "NFR-A11Y-005 shows the %s module with its icon and name, not colour alone",
    (module) => {
      render(<ModuleChip module={module} label="Name" />);
      const chip = screen.getByText("Name");
      expect(chip.closest("li")?.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    },
  );
});
