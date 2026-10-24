// Fails the build if a Client Component imports this module, so secrets never reach the browser.
import "server-only";

import { parseServerEnv } from "./server-env-schema";

export const serverEnv = parseServerEnv(process.env);
