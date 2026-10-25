import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { approvedPairs } from "./contrast-pairs";
import { colourValue, themes } from "./tokens";

describe.each(themes)("approved colour pairs in the %s theme", (theme) => {
  it.each(approvedPairs)(
    "NFR-A11Y-002 $foreground on $background reaches $minimum:1",
    ({ foreground, background, minimum }) => {
      const ratio = contrastRatio(colourValue(foreground, theme), colourValue(background, theme));
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    },
  );
});
