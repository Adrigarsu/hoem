import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const complete = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
};

describe("parseEnv", () => {
  it("NFR-SEC-005 rejects a missing Supabase URL", () => {
    const { NEXT_PUBLIC_SUPABASE_URL: _omitted, ...source } = complete;

    expect(() => parseEnv(source)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("NFR-SEC-005 rejects a missing publishable key", () => {
    const { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: _omitted, ...source } = complete;

    expect(() => parseEnv(source)).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("NFR-SEC-005 rejects an empty publishable key", () => {
    expect(() => parseEnv({ ...complete, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("NFR-SEC-005 rejects a malformed Supabase URL", () => {
    expect(() => parseEnv({ ...complete, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("NFR-SEC-005 rejects a Supabase URL that is not http or https", () => {
    expect(() => parseEnv({ ...complete, NEXT_PUBLIC_SUPABASE_URL: "localhost:54321" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("NFR-SEC-005 accepts a complete configuration", () => {
    expect(parseEnv(complete)).toEqual(complete);
  });
});
