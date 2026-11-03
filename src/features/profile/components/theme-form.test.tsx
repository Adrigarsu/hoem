import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { saveThemeAction } from "../actions";
import { ThemeForm } from "./theme-form";

vi.mock("../actions", () => ({ saveThemeAction: vi.fn(async () => ({ saved: true })) }));

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeForm theme="system" />
    </NextIntlClientProvider>,
  );
}

describe("ThemeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete document.documentElement.dataset.theme;
  });

  it("FR-ACC-007 selects the system theme by default", () => {
    renderForm();
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
  });

  it("FR-ACC-007 applies a chosen theme at once and saves it in the profile", async () => {
    renderForm();
    await userEvent.click(screen.getByText("Dark"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(saveThemeAction).toHaveBeenCalledWith("dark");
    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
  });

  it("FR-ACC-007 puts the previous theme back when saving fails, and says so", async () => {
    vi.mocked(saveThemeAction).mockResolvedValueOnce({ saved: false });
    renderForm();
    await userEvent.click(screen.getByText("Dark"));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not save your theme");
    await waitFor(() => expect(screen.getByRole("radio", { name: "System" })).toBeChecked());
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("FR-ACC-007 also goes back when the request never reaches the server", async () => {
    vi.mocked(saveThemeAction).mockRejectedValueOnce(new Error("offline"));
    renderForm();
    await userEvent.click(screen.getByText("Dark"));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not save your theme");
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("FR-ACC-007 goes back to the saved theme when two quick choices both fail", async () => {
    vi.mocked(saveThemeAction).mockResolvedValue({ saved: false });
    renderForm();
    await userEvent.click(screen.getByText("Dark"));
    await userEvent.click(screen.getByText("Light"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("radio", { name: "System" })).toBeChecked());
    expect(document.documentElement.dataset.theme).toBeUndefined();
    vi.mocked(saveThemeAction).mockResolvedValue({ saved: true });
  });
});
