import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss, { type Container } from "postcss";
import { describe, expect, it } from "vitest";
import tokens from "../../docs/design-system/tokens.json";

const css = postcss.parse(readFileSync(join(__dirname, "tokens.css"), "utf8"));

function declarations(container: Container | undefined): Map<string, string> {
  const found = new Map<string, string>();
  container?.each((node) => {
    if (node.type === "decl") found.set(node.prop, node.value);
  });
  return found;
}

function rootRule(parent: Container): Container | undefined {
  return parent.nodes?.find(
    (node): node is postcss.Rule => node.type === "rule" && node.selector === ":root",
  );
}

function atRule(name: string, params = ""): Container | undefined {
  return css.nodes.find(
    (node): node is postcss.AtRule =>
      node.type === "atrule" && node.name === name && node.params === params,
  );
}

function ruleWithSelector(parent: Container | undefined, selector: string): Container | undefined {
  return parent?.nodes?.find(
    (node): node is postcss.Rule => node.type === "rule" && node.selector === selector,
  );
}

const root = declarations(rootRule(css));
// Dark values twice: for the system preference (unless the user chose light) and for a user
// who chose dark (#22).
const systemDark = declarations(
  ruleWithSelector(
    atRule("media", "(prefers-color-scheme: dark)"),
    ':root:not([data-theme="light"])',
  ),
);
const chosenDark = declarations(ruleWithSelector(css, ':root[data-theme="dark"]'));
const theme = declarations(atRule("theme", "static"));
const themeInline = declarations(atRule("theme", "inline"));
const reducedMotionBlock = atRule("media", "(prefers-reduced-motion: reduce)");
const reducedMotion = declarations(reducedMotionBlock && rootRule(reducedMotionBlock));

// "{brand}" in tokens.json refers to another token.
function cssValue(value: string): string {
  const reference = /^\{(.+)\}$/.exec(value)?.[1];
  return reference ? `var(--${reference})` : value;
}

// Prettier may reflow values such as rgba(0,0,0,0.5); spaces do not change them.
function withoutSpaces(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, "");
}

describe("tokens.css", () => {
  it.each(tokens.color.tokens)(
    "NFR-UX-004 defines --$name with its light and dark values",
    ({ name, value }) => {
      expect(withoutSpaces(root.get(`--${name}`))).toBe(withoutSpaces(cssValue(value.light)));
      expect(withoutSpaces(systemDark.get(`--${name}`))).toBe(withoutSpaces(cssValue(value.dark)));
      expect(withoutSpaces(chosenDark.get(`--${name}`))).toBe(withoutSpaces(cssValue(value.dark)));
      expect(themeInline.get(`--color-${name}`)).toBe(`var(--${name})`);
    },
  );

  it("NFR-A11Y-001 sets the color-scheme of native controls for each theme", () => {
    expect([
      root.get("color-scheme"),
      systemDark.get("color-scheme"),
      chosenDark.get("color-scheme"),
    ]).toEqual(["light", "dark", "dark"]);
  });

  it.each([...tokens.spacing.tokens, ...tokens.size.tokens])(
    "NFR-UX-004 defines --$name and maps it to a Tailwind size",
    ({ name, value }) => {
      expect(root.get(`--${name}`)).toBe(value);
      expect(themeInline.get(`--spacing-${name.replace(/^space-/, "")}`)).toBe(`var(--${name})`);
    },
  );

  it.each([...tokens.radius.tokens, ...tokens.stroke.tokens, ...tokens.motion.tokens])(
    "NFR-UX-004 defines --$name",
    ({ name, value }) => {
      expect(theme.get(`--${name}`) ?? root.get(`--${name}`)).toBe(value);
    },
  );

  it.each(tokens.breakpoint.tokens)(
    "NFR-UX-004 defines the $name breakpoint",
    ({ name, value }) => {
      expect(theme.get(`--breakpoint-${name.replace(/^bp-/, "")}`)).toBe(value);
    },
  );

  it.each(tokens.type.groups.flatMap((group) => group.styles))(
    "NFR-UX-004 defines the $name text style",
    (style) => {
      const prefix = `--text-${style.name}`;
      expect(theme.get(prefix)).toBe(style.fontSize);
      expect(theme.get(`${prefix}--line-height`)).toBe(style.lineHeight);
      expect(theme.get(`${prefix}--font-weight`)).toBe(String(style.fontWeight));
    },
  );

  it.each(
    tokens.type.groups
      .flatMap((group) => group.styles)
      .flatMap((style) => ("letterSpacing" in style ? [style] : [])),
  )("NFR-UX-004 defines the letter spacing of the $name text style", ({ name, letterSpacing }) => {
    expect(theme.get(`--text-${name}--letter-spacing`)).toBe(letterSpacing);
  });

  it("NFR-UX-004 uses the token font stack after the self-hosted Plus Jakarta Sans", () => {
    const fallbacks = tokens.type.families.sans.replace(/^"Plus Jakarta Sans", /, "");
    expect(themeInline.get("--font-sans")).toBe(`var(--font-plus-jakarta-sans), ${fallbacks}`);
  });

  it.each([
    "--color-*",
    "--spacing",
    "--spacing-*",
    "--font-*",
    "--text-*",
    "--radius-*",
    "--shadow-*",
    "--inset-shadow-*",
    "--drop-shadow-*",
    "--text-shadow-*",
    "--ease-*",
    "--animate-*",
    "--breakpoint-*",
  ])("NFR-UX-004 removes the Tailwind default %s", (namespace) => {
    expect(theme.get(namespace)).toBe("initial");
  });

  it.each(tokens.motion.tokens.filter(({ name }) => name.startsWith("duration-")))(
    "NFR-A11Y-006 sets --$name to 0.01ms under prefers-reduced-motion",
    ({ name }) => {
      expect(reducedMotion.get(`--${name}`)).toBe("0.01ms");
    },
  );
});
