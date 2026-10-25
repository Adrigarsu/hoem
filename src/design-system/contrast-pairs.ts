// The colour pairs the design system approves (docs/design-system/README.md, "Colour roles").
// A pair that is not listed here has not been checked and must not be used.
export type ColourPair = { foreground: string; background: string; minimum: number };

const TEXT = 4.5;
// Large text, icons, control edges and the focus ring (WCAG 2.2: 1.4.3 and 1.4.11).
const NON_TEXT = 3;

const pageBackgrounds = ["bg", "surface"];
const neutralBackgrounds = [...pageBackgrounds, "surface-subtle"];
const accents = ["meals", "shopping", "expenses", "success", "warning", "danger"];

function on(foreground: string, backgrounds: string[], minimum: number): ColourPair[] {
  return backgrounds.map((background) => ({ foreground, background, minimum }));
}

export const approvedPairs: ColourPair[] = [
  ...["text", "text-secondary", "text-muted"].flatMap((text) => on(text, neutralBackgrounds, TEXT)),
  ...["brand", ...accents].flatMap((accent) => on(accent, pageBackgrounds, TEXT)),
  ...on("on-brand", ["brand", "brand-hover"], TEXT),
  ...accents.flatMap((accent) => on("on-accent", [accent], TEXT)),
  ...["brand", ...accents].flatMap((accent) => on(`${accent}-ink`, [`${accent}-tint`], TEXT)),
  ...on("border-control", pageBackgrounds, NON_TEXT),
  ...on("focus-ring", pageBackgrounds, NON_TEXT),
];
