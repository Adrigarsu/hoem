import { describe, expect, it } from "vitest";
import { requestOrigin } from "./request-origin";

describe("requestOrigin", () => {
  it("FR-ACC-001 uses the host and protocol forwarded by Vercel", () => {
    const headers = new Headers({
      host: "internal:3000",
      "x-forwarded-host": "hoem-git-feat-x.vercel.app",
      "x-forwarded-proto": "https",
    });
    expect(requestOrigin(headers)).toBe("https://hoem-git-feat-x.vercel.app");
  });

  it("FR-ACC-001 uses http for a local server", () => {
    expect(requestOrigin(new Headers({ host: "localhost:3100" }))).toBe("http://localhost:3100");
  });

  it("NFR-SEC-004 assumes https for any other host without a forwarded protocol", () => {
    expect(requestOrigin(new Headers({ host: "hoemapp.com" }))).toBe("https://hoemapp.com");
  });
});
