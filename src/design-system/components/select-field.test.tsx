import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SelectField } from "./select-field";

const options = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
];

describe("SelectField", () => {
  it("NFR-A11Y-003 is a native select named by its label", () => {
    render(<SelectField label="Role" name="role" options={options} />);
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveValue("parent");
  });

  it("NFR-A11Y-003 starts empty when a placeholder asks for a choice", () => {
    render(<SelectField label="Role" name="role" options={options} placeholder="Choose a role" />);
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveValue("");
  });

  it("NFR-A11Y-005 links the help and the error to the select", () => {
    render(
      <SelectField
        label="Role"
        name="role"
        options={options}
        help="Who they are"
        error="Choose a role"
      />,
    );
    const select = screen.getByRole("combobox", { name: "Role" });
    expect(select).toHaveAccessibleDescription("Who they are Choose a role");
    expect(select).toBeInvalid();
  });

  it("NFR-A11Y-005 keeps saying why a disabled select cannot change", () => {
    render(
      <SelectField
        label="Type"
        name="type"
        options={options}
        help="Only owners can change this"
        disabled
      />,
    );
    const select = screen.getByRole("combobox", { name: "Type" });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription("Only owners can change this");
  });
});
