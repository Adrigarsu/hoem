import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import type { HouseholdFormState } from "../actions";
import { NewHouseholdForm } from "./new-household-form";

const actions = vi.hoisted(() => ({
  createHouseholdAction: vi.fn(
    async (_: HouseholdFormState, __: FormData): Promise<HouseholdFormState> => ({
      status: "refused",
      refusal: "minorCreator",
    }),
  ),
}));
vi.mock("../actions", () => actions);

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <NewHouseholdForm cancelHref="/settings" />
    </NextIntlClientProvider>,
  );
}

describe("NewHouseholdForm", () => {
  it("FR-ACC-009 asks for a name and a type before creating anything", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Create household" }));
    expect(screen.getByRole("textbox", { name: "Household name" })).toHaveAccessibleDescription(
      "Give the household a name",
    );
    expect(screen.getByRole("group", { name: "Who lives there?" })).toHaveAccessibleDescription(
      "Choose who lives there",
    );
    expect(actions.createHouseholdAction).not.toHaveBeenCalled();
  });

  it("NFR-LEG-001 tells someone under 14 how they join a household", async () => {
    renderForm();
    await userEvent.type(screen.getByRole("textbox", { name: "Household name" }), "My room");
    await userEvent.click(screen.getByRole("radio", { name: /Shared flat/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create household" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "People under 14 join a household through a parent",
    );
  });
});
