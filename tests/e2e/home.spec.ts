import { expect, test } from "./support/fixtures";

test("NFR-UX-001 a signed-out visitor of Home gets the sign-in page, which fits and passes axe", async ({
  page,
  visit,
}) => {
  await visit("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
});
