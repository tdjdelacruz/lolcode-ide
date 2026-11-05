import { describe, expect, it } from "vitest";
import { tokenize } from "../../src/lexer";
import { parseTokens } from "../../src/parser";
const parse = (s: string) => {
  const l = tokenize(s),
    p = parseTokens(l.tokens);
  return { ...p, diagnostics: [...l.diagnostics, ...p.diagnostics] };
};
describe("LOLCODE parser", () => {
  it("parses an empty program", () => {
    const r = parse("HAI 1.3\\nKTHXBYE");
    expect(r.ast.body).toHaveLength(0);
    expect(r.diagnostics).toHaveLength(0);
  });
  it("parses declarations, assignment, input and output", () => {
    const r = parse(
      [
        "HAI 1.3",
        "I HAS A score ITZ 10",
        "score R SUM OF score AN 5",
        "GIMMEH score",
        "VISIBLE score",
        "KTHXBYE",
      ].join("\\n"),
    );
    expect(r.ast.body.map((n) => n.kind)).toEqual([
      "VariableDeclaration",
      "Assignment",
      "Input",
      "Output",
    ]);
    expect(r.diagnostics).toHaveLength(0);
  });
  it("parses nested prefix expressions", () => {
    const r = parse(
      "HAI 1.3\\nVISIBLE SUM OF 2 AN PRODUKT OF 3 AN 4\\nKTHXBYE",
    );
    const n = r.ast.body[0];
    expect(n.kind).toBe("Output");
    if (n.kind === "Output") {
      expect(n.values[0].kind).toBe("BinaryExpression");
      if (n.values[0].kind === "BinaryExpression")
        expect(n.values[0].right.kind).toBe("BinaryExpression");
    }
    expect(r.diagnostics).toHaveLength(0);
  });
  it("parses nested conditionals", () => {
    const r = parse(
      [
        "HAI 1.3",
        "O RLY?",
        "YA RLY",
        'VISIBLE "yes"',
        "O RLY?",
        "YA RLY",
        'VISIBLE "nested"',
        "OIC",
        "NO WAI",
        'VISIBLE "no"',
        "OIC",
        "KTHXBYE",
      ].join("\\n"),
    );
    expect(r.ast.body[0].kind).toBe("Conditional");
    expect(r.diagnostics).toHaveLength(0);
  });
  it("reports missing AN, terminator and empty output", () => {
    const r = parse("HAI 1.3\\nVISIBLE SUM OF 1 2\\nVISIBLE");
    expect(r.diagnostics.some((d) => d.code === "SYN006")).toBe(true);
    expect(r.diagnostics.some((d) => d.code === "SYN003")).toBe(true);
    expect(r.diagnostics.some((d) => d.code === "SYN010")).toBe(true);
  });
  it("does not mutate lexer tokens", () => {
    const tokens = tokenize("HAI 1.3\\nKTHXBYE").tokens,
      before = [...tokens];
    parseTokens(tokens);
    expect(tokens).toEqual(before);
  });
});
