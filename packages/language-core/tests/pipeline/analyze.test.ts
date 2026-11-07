import { describe, expect, it } from "vitest";
import { analyzeSource } from "../../src";

describe("language analysis pipeline", () => {
  it("analyzes a valid LOLCODE program", () => {
    const source = `HAI 1.3
I HAS A total ITZ SUM OF 10 AN 20
VISIBLE total
KTHXBYE`;

    const result = analyzeSource(source);

    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.ast.kind).toBe("Program");
    expect(result.diagnostics).toHaveLength(0);
    expect(result.hasErrors).toBe(false);
    expect(result.semantic.symbols.get("total")?.type).toBe("NUMBR");
  });

  it("combines lexer, parser, and semantic diagnostics", () => {
    const source = `HAI 1.3
VISIBLE missing
VISIBLE @
KTHXBYE`;

    const result = analyzeSource(source);

    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.hasErrors).toBe(true);
  });

  it("returns the original source", () => {
    const source = `HAI 1.3
KTHXBYE`;

    const result = analyzeSource(source);

    expect(result.source).toBe(source);
  });
});
