import tokens from "../../docs/design-system/tokens.json";

// docs/design-system/tokens.json is the source of truth; tokens.css is checked against it.
export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

type ThemedValue = Record<Theme, string>;
type ColourToken = { name: string; value: ThemedValue };

// A value such as "{brand}" refers to another token; the result holds only final values.
export function resolveColours(list: readonly ColourToken[]): Record<string, ThemedValue> {
  const raw = new Map(list.map((token) => [token.name, token.value]));

  function resolve(value: string, theme: Theme): string {
    const reference = /^\{(.+)\}$/.exec(value)?.[1];
    if (!reference) return value;
    const target = raw.get(reference);
    if (!target) throw new Error(`Unknown token reference: ${value}`);
    return resolve(target[theme], theme);
  }

  return Object.fromEntries(
    list.map(({ name, value }) => [
      name,
      { light: resolve(value.light, "light"), dark: resolve(value.dark, "dark") },
    ]),
  );
}

const colourTokens = resolveColours(tokens.color.tokens);

export function colourValue(name: string, theme: Theme): string {
  const token = colourTokens[name];
  if (!token) throw new Error(`Unknown colour token: ${name}`);
  return token[theme];
}
