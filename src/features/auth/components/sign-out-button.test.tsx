import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import type * as designSystem from "@/design-system";
import { commitWaitingUndos } from "@/design-system";
import messages from "../../../../messages/en.json";
import { signOutAction } from "../actions";
import { SignOutButton } from "./sign-out-button";

vi.mock("../actions", () => ({ signOutAction: vi.fn(async () => undefined) }));
vi.mock("@/design-system", async (original) => ({
  ...(await original<typeof designSystem>()),
  commitWaitingUndos: vi.fn(async () => undefined),
}));

describe("SignOutButton", () => {
  it("NFR-UX-002 commits deletes still waiting for their undo before signing out", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <SignOutButton />
      </NextIntlClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(commitWaitingUndos).toHaveBeenCalledTimes(1);
    expect(signOutAction).toHaveBeenCalledTimes(1);
    expect(vi.mocked(commitWaitingUndos).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(signOutAction).mock.invocationCallOrder[0] ?? 0,
    );
  });
});
