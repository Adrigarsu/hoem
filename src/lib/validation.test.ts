import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formFieldErrors } from "./validation";

const schema = z.object({
  name: z.string().min(1, { error: "required" }).max(3, { error: "tooLong" }),
  split: z.object({ userId: z.uuid({ error: "invalidUser" }) }),
});

describe("formFieldErrors", () => {
  it("NFR-SEC-002 keeps the first message key for each field", () => {
    const result = schema.safeParse({ name: "", split: { userId: "x" } });
    expect(formFieldErrors(result.error)).toEqual({
      name: "required",
      "split.userId": "invalidUser",
    });
  });

  it("NFR-SEC-002 has nothing to show when the input is valid", () => {
    expect(formFieldErrors(undefined)).toEqual({});
  });
});
