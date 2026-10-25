// NFR-UX-004: colours are defined once, in the design tokens. Everything else uses var(--…).
const colourFunctions = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
];

/** @type {import("stylelint").Config} */
const config = {
  // The reference CSS in docs/ shows the tokens with their raw values.
  ignoreFiles: ["docs/**"],
  rules: {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": colourFunctions,
  },
  overrides: [
    {
      files: ["src/design-system/tokens.css"],
      rules: { "color-no-hex": null, "function-disallowed-list": null },
    },
  ],
};

export default config;
