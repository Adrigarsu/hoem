import { describe, expect, it } from "vitest";
import { authCookieOptions } from "./cookie-options";

describe("authCookieOptions", () => {
  it("NFR-SEC-004 makes auth cookies HttpOnly, SameSite=Lax and Secure over https", () => {
    expect(authCookieOptions("https://hoemapp.com")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("NFR-SEC-004 drops Secure only for a plain http origin, which browsers would refuse", () => {
    expect(authCookieOptions("http://localhost:3100")).toMatchObject({
      httpOnly: true,
      secure: false,
    });
  });
});
