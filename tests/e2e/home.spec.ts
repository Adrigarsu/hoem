import { expect, test } from "./support/fixtures";

test("NFR-UX-001 a signed-out visitor of Home gets the sign-in page, which fits and passes axe", async ({
  page,
  visit,
}) => {
  await visit("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  // The h1 is the tagline on phones and "Sign in" on desktop (sign-in.md); the form is on both.
  await expect(page.getByRole("form", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});
