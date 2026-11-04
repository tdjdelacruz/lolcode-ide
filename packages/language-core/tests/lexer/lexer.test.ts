import { describe, expect, it } from "vitest";
import { tokenize, TokenType } from "../../src/lexer";

describe("LOLCODE lexer", () => {
  it("tokenizes a basic program", () => {
    const r = tokenize("HAI 1.3\nI HAS A age ITZ 26\nVISIBLE age\nKTHXBYE");
    expect(r.diagnostics).toHaveLength(0);
    expect(r.tokens.map((t) => t.type)).toEqual([
      TokenType.HAI,
      TokenType.VERSION,
      TokenType.NEWLINE,
      TokenType.I_HAS_A,
      TokenType.IDENTIFIER,
      TokenType.ITZ,
      TokenType.NUMBR_LITERAL,
      TokenType.NEWLINE,
      TokenType.VISIBLE,
      TokenType.IDENTIFIER,
      TokenType.NEWLINE,
      TokenType.KTHXBYE,
      TokenType.EOF,
    ]);
    expect(r.tokens[1].value).toBe("1.3");
    expect(r.tokens[6].value).toBe(26);
  });

  it("matches multiword keywords with flexible spaces/tabs", () => {
    const r = tokenize("SUM   OF 1 AN\t2");
    expect(r.tokens[0].type).toBe(TokenType.SUM_OF);
    expect(r.tokens[0].lexeme).toBe("SUM   OF");
  });

  it("does not match a phrase whose last word continues into an identifier", () => {
    const r = tokenize("I HAS Aname");
    expect(r.tokens.slice(0, 3).map((t) => t.lexeme)).toEqual([
      "I",
      "HAS",
      "Aname",
    ]);
    expect(
      r.tokens.slice(0, 3).every((t) => t.type === TokenType.IDENTIFIER),
    ).toBe(true);
  });

  it("keeps keywords case-sensitive", () => {
    const r = tokenize("VISIBLE visible Visible");
    expect(r.tokens.slice(0, 3).map((t) => t.type)).toEqual([
      TokenType.VISIBLE,
      TokenType.IDENTIFIER,
      TokenType.IDENTIFIER,
    ]);
  });

  it("decodes the supported LOLCODE string escapes", () => {
    const r = tokenize('"Hello:)world:>there:>:"::"');
    expect(r.diagnostics).toHaveLength(0);
    expect(r.tokens[0].value).toBe('Hello\nworld\tthere\t":');
  });

  it("reports unsupported escapes and continues", () => {
    const r = tokenize('"bad:x" VISIBLE');
    expect(r.diagnostics[0].code).toBe("LEX002");
    expect(r.tokens[1].type).toBe(TokenType.VISIBLE);
  });

  it("reports unterminated strings without consuming the newline", () => {
    const r = tokenize('"unfinished\nVISIBLE');
    expect(r.diagnostics[0].code).toBe("LEX001");
    expect(r.tokens[1].type).toBe(TokenType.NEWLINE);
    expect(r.tokens[2].type).toBe(TokenType.VISIBLE);
  });

  it("discards comments while preserving comment newlines", () => {
    const r = tokenize(
      "VISIBLE 1 BTW comment\nOBTW hidden\ntext TLDR\nKTHXBYE",
    );
    expect(r.tokens.map((t) => t.type)).toEqual([
      TokenType.VISIBLE,
      TokenType.NUMBR_LITERAL,
      TokenType.NEWLINE,
      TokenType.NEWLINE,
      TokenType.NEWLINE,
      TokenType.KTHXBYE,
      TokenType.EOF,
    ]);
  });

  it("reports unterminated multiline comments", () => {
    const r = tokenize("OBTW never closed");
    expect(r.diagnostics[0].code).toBe("LEX003");
    expect(r.tokens.at(-1)?.type).toBe(TokenType.EOF);
  });

  it("recognizes numeric forms and the HAI version", () => {
    const r = tokenize("HAI 1.3\n0 -7 3.14 -0.5 1.3");
    expect(r.tokens.map((t) => t.type)).toEqual([
      TokenType.HAI,
      TokenType.VERSION,
      TokenType.NEWLINE,
      TokenType.NUMBR_LITERAL,
      TokenType.NUMBR_LITERAL,
      TokenType.NUMBAR_LITERAL,
      TokenType.NUMBAR_LITERAL,
      TokenType.NUMBAR_LITERAL,
      TokenType.EOF,
    ]);
  });

  it("reports malformed numeric-looking sequences", () => {
    const r = tokenize("12abc 1.2.3 01");
    expect(r.diagnostics.filter((d) => d.code === "LEX005")).toHaveLength(3);
    expect(r.tokens.map((t) => t.type)).toEqual([TokenType.EOF]);
  });

  it("tracks CRLF positions", () => {
    const r = tokenize("VISIBLE\r\nWIN");
    expect(r.tokens[1].lexeme).toBe("\r\n");
    expect(r.tokens[2].span.start).toEqual({ line: 2, column: 1, offset: 9 });
  });

  it("recovers from invalid characters and emits one EOF", () => {
    const r = tokenize("@ VISIBLE");
    expect(r.diagnostics[0].code).toBe("LEX004");
    expect(r.tokens.map((t) => t.type)).toEqual([
      TokenType.VISIBLE,
      TokenType.EOF,
    ]);
  });
});
