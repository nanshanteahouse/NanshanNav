// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { parseBookmarks } from "@/lib/bookmarks";

describe("bookmark import", () => {
  it("preserves folders, rejects executable URLs and deduplicates existing URLs", () => {
    const result = parseBookmarks(
      '<DL><DT><H3>Home</H3><DL><DT><A HREF="https://nas.example/">NAS</A><DT><A HREF="https://nas.example/#photos">Duplicate</A><DT><A HREF="javascript:alert(1)">Bad</A><DT><A HREF="https://router.example/">Router</A></DL></DL>',
      ["https://router.example"],
    );
    expect(result.count).toBe(1);
    expect(result.duplicates).toBe(2);
    expect(result.groups[0].name).toBe("Home");
    expect(result.groups[0].links[0].tags).toEqual(["Home"]);
  });
  it("rejects URL-embedded credentials and does not execute HTML", () => {
    expect(
      parseBookmarks(
        '<script>throw Error()</script><a href="https://user:pass@example.com">secret</a>',
      ).count,
    ).toBe(0);
  });
  it("preserves the first bookmark anchor and bounds folder tags", () => {
    const result = parseBookmarks(
      `<DL><DT><H3>${"a".repeat(150)}</H3><DL><DT><A HREF="https://docs.example/guide#chapter-2">Guide</A></DL></DL>`,
    );
    expect(result.groups[0].links[0].url).toBe(
      "https://docs.example/guide#chapter-2",
    );
    expect(result.groups[0].links[0].tags?.[0].length).toBe(100);
  });
  it("limits input size before parsing", () => {
    expect(() => parseBookmarks("a".repeat(5 * 1024 * 1024 + 1))).toThrow();
  });
});
