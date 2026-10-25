import tokens from "../../docs/design-system/tokens.json";

// docs/design-system/tokens.json is the source of truth; tokens.css is checked against it.
export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

type ThemedValue = Record<Theme, string>;

const rawColours = new Map<string, ThemedValue>(
  tokens.color.tokens.map((token) => [token.name, token.value]),
);

// A value such as "{brand}" refers to another token.
function resolve(value: string, theme: Theme): string {
  const reference = /^\{(.+)\}$/.exec(value)?.[1];
  if (!reference) return value;
  const target = rawColours.get(reference);
  if (!target) throw new Error(`Unknown token reference: ${value}`);
  return resolve(target[theme], theme);
}

const colourTokens: Record<string, ThemedValue> = Object.fromEntries(
  [...rawColours].map(([name, value]) => [
    name,
    { light: resolve(value.light, "light"), dark: resolve(value.dark, "dark") },
  ]),
);

export function colourValue(name: string, theme: Theme): string {
  const token = colourTokens[name];
  if (!token) throw new Error(`Unknown colour token: ${name}`);
  return token[theme];
}
