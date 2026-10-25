import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/en.json";
import { HomeHeading } from "./home-heading";

describe("HomeHeading", () => {
  it("NFR-I18N-001 shows the product name from the English messages", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <HomeHeading />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "HØEM" })).toBeInTheDocument();
  });
});
