/// <reference types="node" />
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import en from "@/i18n/locales/en";
import zh from "@/i18n/locales/zh-CN";

function flatten(value: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof child === "string"
        ? [[path, child]]
        : Object.entries(flatten(child, path));
    }),
  );
}
function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.name === "__tests__") return [];
    return entry.isDirectory()
      ? sources(path)
      : /\.tsx?$/.test(path)
        ? [path]
        : [];
  });
}
describe("translation completeness", () => {
  it("provides the same nonempty keys in both languages", () => {
    const english = flatten(en);
    const chinese = flatten(zh);
    expect(Object.keys(english).sort()).toEqual(Object.keys(chinese).sort());
    for (const [key, value] of Object.entries(english)) {
      expect(value.trim(), key).not.toBe("");
      expect(chinese[key].trim(), key).not.toBe("");
    }
  });
  it("resolves all literal translation keys used by the application", () => {
    const keys = flatten(en);
    const missing = sources(resolve("src")).flatMap((path) => {
      const source = readFileSync(path, "utf8");
      return [...source.matchAll(/\bt\(\s*['"]([\w.-]+)['"]/g)]
        .filter((match) => !(match[1] in keys))
        .map((match) => `${path}: ${match[1]}`);
    });
    expect(missing).toEqual([]);
  });
});
