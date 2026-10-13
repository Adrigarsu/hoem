// PostToolUse hook: formats the file Claude Code just wrote or edited with Prettier.
// Claude Code sends the tool call as JSON on stdin; we only need tool_input.file_path.
// Prettier is called through Node directly so the hook works the same on Windows and Linux.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const FORMATTABLE = /\.(?:[cm]?[jt]sx?|json|css|md|ya?ml)$/i;
const PRETTIER_BIN = resolve("node_modules/prettier/bin/prettier.cjs");

let input = "";
for await (const chunk of process.stdin) input += chunk;

const filePath = JSON.parse(input)?.tool_input?.file_path;

if (typeof filePath === "string" && FORMATTABLE.test(filePath) && existsSync(PRETTIER_BIN)) {
  try {
    execFileSync(process.execPath, [PRETTIER_BIN, "--write", "--ignore-unknown", filePath], {
      stdio: "ignore",
    });
  } catch {
    // A file Prettier cannot parse yet must not block Claude; lint and CI will report it.
  }
}
