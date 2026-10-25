import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import i18next from "eslint-plugin-i18next";
import jsxA11y from "eslint-plugin-jsx-a11y";

// A hex colour on its own, or a colour function anywhere in a string.
const hardCodedColour = String.raw`/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i`;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Strict accessibility rules (WCAG 2.2 AA) on top of Next.js defaults.
    // The jsx-a11y plugin itself is already registered by eslint-config-next.
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.strict.rules,
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // NFR-UX-004: only design-system utilities. Class order is left to prettier-plugin-tailwindcss.
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: { "better-tailwindcss": { entryPoint: "src/app/globals.css" } },
    rules: {
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            {
              // An arbitrary value or a CSS variable in the utility itself (bg-[#fff], p-(--gap),
              // [mask-type:luminance]). Arbitrary variants such as aria-[current=page]: are allowed.
              pattern: String.raw`^(?:(?:[^:\[]|\[[^\]]*\])*:)*[^:\[(]*(?:\[[^\]]*\]|\([^)]*\))[^:]*$`,
              message: "Arbitrary values bypass the design tokens. Use a token utility instead.",
            },
            {
              pattern: String.raw`^(.*:)?duration-\d+$`,
              message: "Use duration-fast, duration-base or duration-slow.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/design-system/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // In-page links such as href="#add" look like hex colours.
          selector: `:not(JSXAttribute[name.name="href"]) > Literal[value=${hardCodedColour}]`,
          message: "Hard-coded colour. Use a design token (NFR-UX-004).",
        },
        {
          selector: `TemplateElement[value.raw=${hardCodedColour}]`,
          message: "Hard-coded colour. Use a design token (NFR-UX-004).",
        },
      ],
    },
  },
  {
    // NFR-I18N-001: user-facing text comes from messages/*.json through next-intl.
    files: ["src/**/*.tsx"],
    ignores: ["src/**/*.test.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "jsx-attributes": {
            include: ["alt", "aria-label", "aria-description", "label", "placeholder", "title"],
          },
          "should-validate-template": true,
          // Message keys passed to next-intl's translator are not user-facing text.
          callees: { exclude: ["^t$", String.raw`^t\.(rich|markup|raw|has)$`] },
        },
      ],
    },
  },
  {
    // Playwright fixtures receive a callback named `use`, which is not React's use() hook.
    files: ["tests/e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  // Must stay last: turns off rules that would conflict with Prettier.
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
