import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFormFocus } from "./use-form-focus";

function Form({
  errors,
  hasFormError = false,
}: {
  errors?: Record<string, string>;
  hasFormError?: boolean;
}) {
  const { formRef, messageRef } = useFormFocus(errors, hasFormError);
  return (
    <form ref={formRef} aria-label="Form">
      <div ref={messageRef} tabIndex={-1} role="alert">
        Something failed
      </div>
      <input aria-label="Name" name="name" />
      <input aria-label="Email" name="email" />
    </form>
  );
}

describe("useFormFocus", () => {
  it("NFR-A11Y-003 moves focus to the first field with an error", () => {
    render(<Form errors={{ email: "invalidEmail", name: "required" }} />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
  });

  it("NFR-A11Y-003 moves focus to the form message when no field has an error", () => {
    render(<Form hasFormError />);
    expect(screen.getByRole("alert")).toHaveFocus();
  });

  it("NFR-A11Y-003 leaves focus alone when there is nothing to fix", () => {
    render(<Form />);
    expect(document.body).toHaveFocus();
  });
});
