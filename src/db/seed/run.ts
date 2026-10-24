// Command-line entry for `pnpm db:seed`, kept apart so importing seed() never runs it.
import { seed } from "./index";

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
