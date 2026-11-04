import { describe, expect, it } from "vitest";
import { apiCredentials } from "./api-credentials";
import { ForbiddenError, NotAuthenticatedError } from "./errors";

const site = { host: "hoemapp.com", "x-forwarded-proto": "https" };

describe("apiCredentials", () => {
  it("NFR-SEC-001 takes the access token from a Bearer header", () => {
    const headers = new Headers({ ...site, authorization: "Bearer eyJ.token.sig" });
    expect(apiCredentials(headers)).toEqual({ accessToken: "eyJ.token.sig" });
  });

  it("NFR-SEC-001 accepts the session cookie from the app's own origin", () => {
    const headers = new Headers({ ...site, origin: "https://hoemapp.com" });
    expect(apiCredentials(headers)).toEqual({});
  });

  it("NFR-SEC-006 refuses a cookie request from another origin, so another site cannot forge it", () => {
    const headers = new Headers({ ...site, origin: "https://evil.example" });
    expect(() => apiCredentials(headers)).toThrow(ForbiddenError);
  });

  it("NFR-SEC-006 refuses a cookie request without an origin", () => {
    expect(() => apiCredentials(new Headers(site))).toThrow(ForbiddenError);
  });

  it("NFR-SEC-001 refuses an empty or non-Bearer Authorization header instead of falling back to cookies", () => {
    const headers = new Headers({
      ...site,
      origin: "https://hoemapp.com",
      authorization: "Bearer ",
    });
    expect(() => apiCredentials(headers)).toThrow(NotAuthenticatedError);
    headers.set("authorization", "Basic dXNlcjpwYXNz");
    expect(() => apiCredentials(headers)).toThrow(NotAuthenticatedError);
  });
});
