import { it, expect } from "vitest";
import { contrastRatio } from "@/components/ui/contrast";
import { DEFAULT_COLORS } from "@/types/dashboard";
it("keeps all default small text and primary button labels above 4.5:1", () => {
  for (const theme of Object.values(DEFAULT_COLORS)) {
    for (const text of [
      theme.textPrimary,
      theme.textSecondary,
      theme.textMuted,
    ]) {
      expect(contrastRatio(text, theme.bgWidget)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#fff", theme.accentPrimary)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(
      contrastRatio("#fff", theme.accentPrimaryHover),
    ).toBeGreaterThanOrEqual(4.5);
  }
});
