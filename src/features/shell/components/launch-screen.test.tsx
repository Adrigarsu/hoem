import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/en.json";
import { LaunchScreen } from "./launch-screen";

function renderLaunchScreen() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LaunchScreen />
    </NextIntlClientProvider>,
  );
}

describe("LaunchScreen", () => {
  it("FR-NAV-004 shows the HØEM logo", () => {
    renderLaunchScreen();
    expect(screen.getByRole("img", { name: "HØEM" })).toBeInTheDocument();
  });

  it("FR-NAV-004 announces that HØEM is loading once the status is on the page", async () => {
    renderLaunchScreen();
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await waitFor(() => expect(status).toHaveTextContent("Opening your home…"));
  });

  it("FR-NAV-004 keeps a page title while the next page's title is on its way", () => {
    renderLaunchScreen();
    expect(document.title).toBe("HØEM");
  });
});
