import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
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
        {
          // OwnAvatar hides the photo at once while its removal can still be undone (FR-ACC-007).
          selector: `JSXOpeningElement[name.name="Avatar"] > JSXAttribute[name.name="src"] MemberExpression[property.name="avatarUrl"]`,
          message: "The signed-in user's own photo goes through OwnAvatar from @/features/profile.",
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
          // Message keys passed to next-intl's translator are not user-facing text. A component
          // that reads a second namespace names that translator after it, such as tShell.
          callees: {
            exclude: [
              String.raw`^t(?:[A-Z]\w*)?$`,
              String.raw`^t(?:[A-Z]\w*)?\.(rich|markup|raw|has)$`,
            ],
          },
        },
      ],
    },
  },
  {
    // Architecture rules (docs/architecture.md §4.2): dependencies only point down, and a feature
    // is reached from outside only through its index.ts. Each feature folder is an element and its
    // layers are file categories. Unit tests may reach inside the layer they test, so they are
    // left out.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": { typescript: { alwaysTryTypes: true } },
      "boundaries/elements": [
        { type: "feature", pattern: "src/features/*", partialMatch: false, capture: ["feature"] },
        ...["app", "design-system", "db", "lib"].map((type) => ({
          type,
          pattern: `src/${type}`,
          partialMatch: false,
        })),
      ],
      // The first category that matches a file is its only one.
      "boundaries/files": [
        ...["domain", "components"].map((category) => ({
          category,
          pattern: `src/features/*/${category}/**`,
          stopMatching: true,
        })),
        ...["repository", "service", "actions", "schemas", "index"].map((category) => ({
          category,
          pattern: `src/features/*/${category}.ts`,
          stopMatching: true,
        })),
        // Other files of a feature, such as cookies or helpers its layers share.
        { category: "internal", pattern: "src/features/*/*.{ts,tsx}" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          // Layers live in the same feature folder, so imports inside it are checked too.
          checkInternals: true,
          policies: [
            {
              from: { element: { type: "feature" } },
              disallow: {
                to: {
                  element: {
                    type: "feature",
                    captured: { feature: "!{{ from.captured.feature }}" },
                  },
                  file: { categories: "!index" },
                },
              },
              message: "Import another feature only through its index.ts.",
            },
            {
              from: { element: { types: ["app", "design-system", "db", "lib"] } },
              disallow: { to: { element: { type: "feature" }, file: { categories: "!index" } } },
              message: "Import a feature only through its index.ts.",
            },
            {
              from: { file: { categories: "domain" } },
              disallow: [
                { to: { element: { type: "feature" }, file: { categories: "!domain" } } },
                { to: { element: { types: ["app", "design-system", "db", "lib"] } } },
              ],
              message: "The domain is pure TypeScript: it imports only other domain files.",
            },
            {
              // The repository implements the gateway type its service declares (dependency
              // inversion), so it may import the service, but nothing above it.
              from: { file: { categories: "repository" } },
              disallow: {
                to: {
                  element: { type: "feature" },
                  file: { categories: ["actions", "components"] },
                },
              },
              message: "A repository does not depend on Server Actions or components.",
            },
            {
              // A service works through the gateway it declares; the entry point passes it the
              // repository, so the service never imports one.
              from: { file: { categories: "service" } },
              disallow: {
                to: {
                  element: { type: "feature" },
                  file: { categories: ["repository", "actions", "components"] },
                },
              },
              message: "A service receives its repository as a gateway; it never imports one.",
            },
            {
              from: { file: { categories: "actions" } },
              disallow: {
                to: { file: { categories: "components" } },
              },
              message: "A Server Action does not depend on components.",
            },
            {
              // Components may share a service's types, but call it only through a Server Action.
              from: { file: { categories: "components" } },
              disallow: {
                to: {
                  element: { type: "feature" },
                  file: { categories: ["repository", "service"] },
                },
                dependency: { kind: "value" },
              },
              message:
                "Components reach data through Server Actions, not services or repositories.",
            },
          ],
        },
      ],
    },
  },
  {
    // The domain is pure TypeScript (docs/architecture.md §4.2): no framework, no I/O.
    files: ["src/features/*/domain/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next", "next/*", "next-intl", "next-intl/*"],
              message: "The domain is pure TypeScript: no React or Next.js.",
            },
            {
              group: [
                "@supabase/*",
                "drizzle-orm",
                "drizzle-orm/*",
                "server-only",
                "@/db",
                "@/db/*",
              ],
              message: "The domain is pure TypeScript: no Supabase or database code.",
            },
          ],
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
