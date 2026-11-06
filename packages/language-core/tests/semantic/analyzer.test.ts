import { describe, expect, it } from "vitest";
import { tokenize } from "../../src/lexer";
import { parseTokens } from "../../src/parser";
import { analyze } from "../../src/semantic";

function analyzeSource(source: string) {
  const lexed = tokenize(source);
  const parsed = parseTokens(lexed.tokens);
  return { lexed, parsed, semantic: analyze(parsed.ast) };
}

describe("semantic analyzer", () => {
  it("accepts a declared and initialized numeric variable", () => {
    const result = analyzeSource("HAI 1.3\nI HAS A total ITZ SUM OF 10 AN 20\nVISIBLE total\nKTHXBYE");
    expect(result.semantic.diagnostics).toHaveLength(0);
    expect(result.semantic.symbols.get("total")?.type).toBe("NUMBR");
  });

  it("reports use of an undeclared variable", () => {
    const result = analyzeSource("HAI 1.3\nVISIBLE missing\nKTHXBYE");
    expect(result.semantic.diagnostics.map(d => d.code)).toContain("SEM002");
  });

  it("reports a duplicate declaration", () => {
    const result = analyzeSource("HAI 1.3\nI HAS A score ITZ 1\nI HAS A score ITZ 2\nKTHXBYE");
    expect(result.semantic.diagnostics.map(d => d.code)).toContain("SEM001");
  });

  it("reports arithmetic with a non-numeric operand", () => {
    const result = analyzeSource('HAI 1.3\nI HAS A answer ITZ SUM OF "hello" AN 2\nKTHXBYE');
    expect(result.semantic.diagnostics.map(d => d.code)).toContain("SEM005");
  });

  it("reports use before initialization", () => {
    const result = analyzeSource("HAI 1.3\nI HAS A value\nVISIBLE value\nKTHXBYE");
    expect(result.semantic.diagnostics.map(d => d.code)).toContain("SEM003");
  });
});
