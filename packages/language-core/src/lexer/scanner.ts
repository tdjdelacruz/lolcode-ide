import type { LexerDiagnostic } from "./diagnostic";
import type { SourcePosition, SourceSpan } from "./source";
import type { Token, TokenValue } from "./token";
import { TokenType } from "./token-types";
import {
  getSingleWordKeyword,
  isIdentifierPart,
  isIdentifierStart,
  matchMultiWordKeyword,
} from "./keywords";

export class Scanner {
  private current = 0;
  private line = 1;
  private column = 1;
  private readonly tokens: Token[] = [];
  private readonly diagnostics: LexerDiagnostic[] = [];

  constructor(private readonly source: string) {}

  scanTokens() {
    while (!this.isAtEnd()) {
      const start = this.position();
      const c = this.peek();

      if (c === " " || c === "\t") {
        this.advance();
        continue;
      }
      if (this.isNewline()) {
        this.scanNewline();
        continue;
      }
      if (this.startsWord("BTW")) {
        this.consumeWord("BTW");
        while (!this.isAtEnd() && !this.isNewline()) this.advance();
        continue;
      }
      if (this.startsWord("OBTW")) {
        this.scanBlockComment();
        continue;
      }
      if (c === '"') {
        this.scanString(start);
        continue;
      }
      if (this.isNumberStart()) {
        this.scanNumber(start);
        continue;
      }
      if (c === ",") {
        this.advance();
        this.addToken(TokenType.COMMA, start);
        continue;
      }

      const multi = matchMultiWordKeyword(this.source, this.current);
      if (multi) {
        while (this.current < multi.end) this.advance();
        this.addToken(multi.type, start);
        continue;
      }
      if (isIdentifierStart(c)) {
        this.scanIdentifier(start);
        continue;
      }
      this.scanInvalid(start);
    }

    const p = this.position();
    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      span: { start: p, end: p },
    });
    return { tokens: this.tokens, diagnostics: this.diagnostics };
  }

  private scanIdentifier(start: SourcePosition) {
    while (isIdentifierPart(this.peek())) this.advance();
    const word = this.source.slice(start.offset, this.current);
    const type = getSingleWordKeyword(word);
    if (type === TokenType.WIN) this.addToken(type, start, true);
    else if (type === TokenType.FAIL) this.addToken(type, start, false);
    else if (type === TokenType.NOOB) this.addToken(type, start, null);
    else
      this.addToken(
        type ?? TokenType.IDENTIFIER,
        start,
        type ? undefined : word,
      );
  }

  private scanNumber(start: SourcePosition) {
    if (this.peek() === "-") this.advance();
    while (this.isNumericPart(this.peek())) this.advance();
    const text = this.source.slice(start.offset, this.current);
    const integer = /^-?(0|[1-9][0-9]*)$/;
    const decimal = /^-?(0|[1-9][0-9]*)\.[0-9]+$/;

    if (this.tokens.at(-1)?.type === TokenType.HAI && text === "1.3") {
      this.addToken(TokenType.VERSION, start, "1.3");
      return;
    }
    if (integer.test(text)) {
      this.addToken(TokenType.NUMBR_LITERAL, start, Number.parseInt(text, 10));
      return;
    }
    if (decimal.test(text)) {
      this.addToken(TokenType.NUMBAR_LITERAL, start, Number.parseFloat(text));
      return;
    }
    this.diagnostic("LEX005", "Malformed numeric literal.", {
      start,
      end: this.position(),
    });
  }

  private scanString(start: SourcePosition) {
    this.advance();
    let value = "",
      closed = false;
    const escapes: Record<string, string> = {
      ")": "\n",
      ">": "\t",
      o: "\u0007",
      '"': '"',
      ":": ":",
    };
    while (!this.isAtEnd() && !this.isNewline()) {
      const c = this.peek();
      if (c === '"') {
        this.advance();
        closed = true;
        break;
      }
      if (c === ":") {
        const escapeStart = this.position();
        this.advance();
        const next = this.peek();
        if (next !== undefined && Object.hasOwn(escapes, next)) {
          value += escapes[next];
          this.advance();
        } else if (next !== undefined) {
          this.advance();
          this.diagnostic("LEX002", `Unsupported escape sequence ':${next}'.`, {
            start: escapeStart,
            end: this.position(),
          });
          value += `:${next}`;
        } else {
          this.diagnostic("LEX002", "Incomplete string escape ':'.", {
            start: escapeStart,
            end: this.position(),
          });
          value += ":";
        }
        continue;
      }
      value += this.advance();
    }
    if (!closed)
      this.diagnostic("LEX001", "Unterminated string literal.", {
        start,
        end: this.position(),
      });
    this.addToken(TokenType.YARN_LITERAL, start, value);
  }

  private scanBlockComment() {
    const start = this.position();
    this.consumeWord("OBTW");
    while (!this.isAtEnd()) {
      if (this.startsWord("TLDR")) {
        this.consumeWord("TLDR");
        return;
      }
      if (this.isNewline()) this.scanNewline();
      else this.advance();
    }
    this.diagnostic("LEX003", "Multiline comment is missing TLDR.", {
      start,
      end: this.position(),
    });
  }

  private scanNewline() {
    const start = this.position();
    if (this.peek() === "\r") {
      this.advance();
      if (this.peek() === "\n") this.advance();
    } else this.advance();
    this.line++;
    this.column = 1;
    this.addToken(TokenType.NEWLINE, start);
  }

  private scanInvalid(start: SourcePosition) {
    const char = this.advanceCodePoint();
    this.diagnostic("LEX004", `Unexpected character '${char}'.`, {
      start,
      end: this.position(),
    });
  }

  private startsWord(word: string) {
    if (!this.source.startsWith(word, this.current)) return false;
    const prev = this.current > 0 ? this.source[this.current - 1] : undefined;
    const next = this.source[this.current + word.length];
    return !isIdentifierPart(prev) && !isIdentifierPart(next);
  }
  private consumeWord(word: string) {
    for (let i = 0; i < word.length; i++) this.advance();
  }
  private isNumberStart() {
    const c = this.peek(),
      n = this.peekNext();
    return (
      (!!c && /^[0-9]$/.test(c)) || (c === "-" && !!n && /^[0-9]$/.test(n))
    );
  }
  private isNumericPart(c: string | undefined) {
    return !!c && /^[A-Za-z0-9_.]$/.test(c);
  }
  private isNewline() {
    return this.peek() === "\n" || this.peek() === "\r";
  }
  private addToken(type: TokenType, start: SourcePosition, value?: TokenValue) {
    const token: Token = {
      type,
      lexeme: this.source.slice(start.offset, this.current),
      span: { start, end: this.position() },
    };
    if (value !== undefined || type === TokenType.NOOB) token.value = value;
    this.tokens.push(token);
  }
  private diagnostic(
    code: LexerDiagnostic["code"],
    message: string,
    span: SourceSpan,
  ) {
    this.diagnostics.push({ code, severity: "error", message, span });
  }
  private position(): SourcePosition {
    return { line: this.line, column: this.column, offset: this.current };
  }
  private peek() {
    return this.source[this.current];
  }
  private peekNext() {
    return this.source[this.current + 1];
  }
  private advance() {
    const c = this.source[this.current] ?? "";
    this.current++;
    this.column++;
    return c;
  }
  private advanceCodePoint() {
    const cp = this.source.codePointAt(this.current);
    if (cp === undefined) return "";
    const c = String.fromCodePoint(cp);
    this.current += c.length;
    this.column += c.length;
    return c;
  }
  private isAtEnd() {
    return this.current >= this.source.length;
  }
}
