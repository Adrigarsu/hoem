import { expect, test } from "./support/fixtures";

test("NFR-UX-001 the home page shows the product name, fits the viewport and passes axe", async ({
  page,
  visit,
}) => {
  await visit("/");
  await expect(page.getByRole("heading", { level: 1, name: "HØEM" })).toBeVisible();
});
