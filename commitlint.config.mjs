// The developer authors every commit; AI tools must never be credited (AGENTS.md, Git workflow).
const aiAttribution = /co-authored-by:.*(claude|anthropic)|generated with \[?claude/i;

const config = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "no-ai-attribution": ({ raw }) => [
          !aiAttribution.test(raw ?? ""),
          "remove the Claude/AI attribution: commits are authored by the developer only",
        ],
      },
    },
  ],
  rules: { "no-ai-attribution": [2, "always"] },
};

export default config;
