/** WCAG relative luminance for configured opaque hexadecimal theme colors. */
export function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const hex = color.replace("#", "");
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((part) => part + part)
            .join("")
        : hex;
    if (!/^[a-f\d]{6}$/i.test(full)) return null;
    const channels = [0, 2, 4].map((offset) => {
      const value = parseInt(full.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === null || second === null) return 0;
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
