import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./server-env-schema";

const complete = {
  RESEND_API_KEY: "re_example",
};

describe("parseServerEnv", () => {
  it("NFR-SEC-005 rejects a missing Resend API key", () => {
    expect(() => parseServerEnv({})).toThrow(/RESEND_API_KEY/);
  });

  it("NFR-SEC-005 rejects a Resend API key without the re_ prefix", () => {
    expect(() => parseServerEnv({ RESEND_API_KEY: "example" })).toThrow(/RESEND_API_KEY/);
  });

  it("NFR-SEC-005 accepts a complete server configuration", () => {
    expect(parseServerEnv(complete)).toEqual(complete);
  });
});
