import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/en.json";
import { LanguageField } from "./language-field";

describe("LanguageField", () => {
  it("FR-ACC-007 has English selected and as the only option for now", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LanguageField locale="en" />
      </NextIntlClientProvider>,
    );
    const select = screen.getByRole("combobox", { name: "Language" });
    expect(select).toHaveValue("en");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["English"]);
  });
});
