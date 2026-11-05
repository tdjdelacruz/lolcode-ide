import type { Token, SourcePosition, SourceSpan } from "../lexer";
import type {
  BinaryOperator,
  ExpressionNode,
  ProgramNode,
  StatementNode,
} from "./ast";
import type { ParserDiagnostic } from "./diagnostic";
import type { ParseResult } from "./result";

type T = Token & { type: unknown };
const OPS: Record<string, BinaryOperator> = {
  SUM_OF: "SUM_OF",
  DIFF_OF: "DIFF_OF",
  PRODUKT_OF: "PRODUKT_OF",
  QUOSHUNT_OF: "QUOSHUNT_OF",
  MOD_OF: "MOD_OF",
  BIGGR_OF: "BIGGR_OF",
  SMALLR_OF: "SMALLR_OF",
  BOTH_OF: "BOTH_OF",
  EITHER_OF: "EITHER_OF",
  WON_OF: "WON_OF",
  BOTH_SAEM: "BOTH_SAEM",
  DIFFRINT: "DIFFRINT",
};
const OP_TYPES = new Set(Object.keys(OPS));
const EXPR = new Set([
  "NUMBR_LITERAL",
  "NUMBAR_LITERAL",
  "YARN_LITERAL",
  "WIN",
  "FAIL",
  "NOOB",
  "IDENTIFIER",
  "IT",
  "NOT",
  ...OP_TYPES,
]);
const BLOCK = new Set(["YA_RLY", "NO_WAI", "OIC", "KTHXBYE", "EOF"]);
const UNSUPPORTED = new Set([
  "MEBBE",
  "WTF",
  "SMOOSH",
  "MAEK",
  "IS_NOW_A",
  "ALL_OF",
  "ANY_OF",
  "SRS",
  "IM_IN_YR",
  "IM_OUTTA_YR",
]);
const typ = (t: T) => String(t.type).toUpperCase();
const span = (a: SourceSpan, b: SourceSpan): SourceSpan => ({
  start: a.start,
  end: b.end,
});
const point = (p: SourcePosition): SourceSpan => ({ start: p, end: p });

export class Parser {
  private i = 0;
  private diagnostics: ParserDiagnostic[] = [];
  private tokens: T[];
  constructor(tokens: readonly Token[]) {
    this.tokens = [...tokens] as T[];
    if (!this.tokens.length) {
      const p = { line: 1, column: 1, offset: 0 };
      this.tokens.push({ type: "EOF", lexeme: "", span: point(p) } as T);
    } else if (typ(this.tokens[this.tokens.length - 1]) !== "EOF") {
      const p = this.tokens[this.tokens.length - 1].span.end;
      this.tokens.push({ type: "EOF", lexeme: "", span: point(p) } as T);
    }
  }
  parse(): ParseResult {
    const first = this.cur();
    let start = first.span;
    if (this.match("HAI")) start = this.prev().span;
    else {
      this.err("SYN001", "Program must begin with HAI.", first.span);
      this.sync(["HAI", "EOF"]);
      if (this.match("HAI")) start = this.prev().span;
    }
    if (this.match("VERSION")) {
      const v = String(this.prev().value ?? this.prev().lexeme);
      if (v !== "1.3")
        this.err("SYN002", "Only version 1.3 is supported.", this.prev().span);
    } else {
      this.err("SYN002", "Expected version 1.3 after HAI.", this.cur().span);
      if (!this.end() && !this.sep(this.cur())) this.advance();
    }
    if (!this.seps())
      this.err(
        "SYN008",
        "Expected a separator after the program header.",
        this.cur().span,
      );
    const body: StatementNode[] = [];
    while (!this.end() && !this.check("KTHXBYE")) {
      if (this.sep(this.cur())) {
        this.seps();
        continue;
      }
      const before = this.i;
      body.push(this.statement());
      if (this.i === before) {
        this.err(
          "SYN008",
          `Unexpected token '${this.cur().lexeme}'.`,
          this.cur().span,
        );
        this.advance();
      }
      if (this.sep(this.cur())) this.seps();
      else if (!this.check("KTHXBYE") && !this.end()) {
        this.err("SYN008", "Expected a statement separator.", this.cur().span);
        this.sync(["NEWLINE", "COMMA", "KTHXBYE", "EOF"]);
        this.seps();
      }
    }
    let end = this.cur().span;
    if (this.match("KTHXBYE")) {
      end = this.prev().span;
      if (!this.check("EOF")) {
        this.err(
          "SYN008",
          "Unexpected content after KTHXBYE.",
          this.cur().span,
        );
        this.sync(["EOF"]);
      }
    } else this.err("SYN003", "Program is missing KTHXBYE.", this.cur().span);
    if (this.check("EOF")) this.advance();
    const ast: ProgramNode = {
      kind: "Program",
      version: "1.3",
      body,
      span: span(start, end),
    };
    return { ast, diagnostics: this.diagnostics };
  }
  private statement(): StatementNode {
    if (this.check("I_HAS_A")) return this.declaration();
    if (this.check("VISIBLE")) return this.output();
    if (this.check("GIMMEH")) return this.input();
    if (this.check("O_RLY")) return this.conditional();
    if (this.check("IDENTIFIER") && this.next("R")) return this.assignment();
    const t = this.cur(),
      word = t.lexeme.toUpperCase().replace(/\s+/g, "_");
    if (UNSUPPORTED.has(word) || UNSUPPORTED.has(t.lexeme.toUpperCase()))
      this.err("SYN009", `'${t.lexeme}' is not supported in this MVP.`, t.span);
    else
      this.err(
        "SYN008",
        `Unexpected token '${t.lexeme}' at statement start.`,
        t.span,
      );
    this.sync([
      "NEWLINE",
      "COMMA",
      "YA_RLY",
      "NO_WAI",
      "OIC",
      "KTHXBYE",
      "EOF",
    ]);
    return { kind: "ErrorStatement", span: t.span };
  }
  private declaration(): StatementNode {
    const s = this.advance().span;
    if (!this.check("IDENTIFIER")) {
      this.err("SYN004", "Expected identifier after I HAS A.", this.cur().span);
      return { kind: "ErrorStatement", span: s };
    }
    const id = this.advance();
    if (id.lexeme.toUpperCase() === "IT")
      this.err("SYN004", "IT cannot be declared.", id.span);
    let initializer: ExpressionNode | undefined,
      end = id.span;
    if (this.match("ITZ")) {
      initializer = this.expression();
      end = initializer.span;
    }
    return {
      kind: "VariableDeclaration",
      name: id.lexeme,
      ...(initializer ? { initializer } : {}),
      span: span(s, end),
    };
  }
  private assignment(): StatementNode {
    const id = this.advance();
    this.advance();
    const value = this.expression();
    return {
      kind: "Assignment",
      name: id.lexeme,
      value,
      span: span(id.span, value.span),
    };
  }
  private input(): StatementNode {
    const s = this.advance().span;
    if (!this.check("IDENTIFIER")) {
      this.err("SYN004", "Expected identifier after GIMMEH.", this.cur().span);
      return { kind: "ErrorStatement", span: s };
    }
    const id = this.advance();
    return { kind: "Input", name: id.lexeme, span: span(s, id.span) };
  }
  private output(): StatementNode {
    const s = this.advance().span,
      values: ExpressionNode[] = [];
    while (
      !this.end() &&
      !this.sep(this.cur()) &&
      !BLOCK.has(typ(this.cur()))
    ) {
      if (!EXPR.has(typ(this.cur()))) {
        this.err(
          "SYN008",
          `Unexpected token '${this.cur().lexeme}' in VISIBLE.`,
          this.cur().span,
        );
        this.advance();
        continue;
      }
      const before = this.i;
      values.push(this.expression());
      if (before === this.i) break;
    }
    if (!values.length) {
      this.err("SYN010", "VISIBLE requires at least one expression.", s);
      return { kind: "ErrorStatement", span: s };
    }
    return {
      kind: "Output",
      values,
      span: span(s, values[values.length - 1].span),
    };
  }
  private conditional(): StatementNode {
    const s = this.advance().span;
    this.seps();
    if (this.match("YA_RLY")) this.seps();
    else {
      this.err("SYN007", "Expected YA RLY after O RLY?.", this.cur().span);
      this.sync(["YA_RLY", "NO_WAI", "OIC", "KTHXBYE", "EOF"]);
      if (this.match("YA_RLY")) this.seps();
    }
    const thenBody = this.branch(["NO_WAI", "OIC", "KTHXBYE", "EOF"]);
    let elseBody: StatementNode[] = [];
    if (this.match("NO_WAI")) {
      this.seps();
      elseBody = this.branch(["OIC", "KTHXBYE", "EOF"]);
    }
    let e = this.prev().span;
    if (this.match("OIC")) e = this.prev().span;
    else
      this.err("SYN007", "Expected OIC to close conditional.", this.cur().span);
    return { kind: "Conditional", thenBody, elseBody, span: span(s, e) };
  }
  private branch(stops: string[]): StatementNode[] {
    const nodes: StatementNode[] = [];
    while (!this.end() && !stops.includes(typ(this.cur()))) {
      if (this.sep(this.cur())) {
        this.seps();
        continue;
      }
      const before = this.i;
      nodes.push(this.statement());
      if (before === this.i) this.advance();
      if (this.sep(this.cur())) this.seps();
      else if (!stops.includes(typ(this.cur())) && !this.end()) {
        this.err(
          "SYN008",
          "Expected separator inside conditional.",
          this.cur().span,
        );
        this.sync([...stops, "NEWLINE", "COMMA"]);
        this.seps();
      }
    }
    return nodes;
  }
  private expression(): ExpressionNode {
    const t = this.cur(),
      k = typ(t);
    if (k === "NUMBR_LITERAL" || k === "NUMBAR_LITERAL") {
      this.advance();
      return {
        kind: "NumberLiteral",
        value: typeof t.value === "number" ? t.value : Number(t.lexeme),
        numericType: k === "NUMBR_LITERAL" ? "NUMBR" : "NUMBAR",
        span: t.span,
      };
    }
    if (k === "YARN_LITERAL") {
      this.advance();
      return {
        kind: "StringLiteral",
        value: String(t.value ?? ""),
        span: t.span,
      };
    }
    if (k === "WIN" || k === "FAIL") {
      this.advance();
      return { kind: "BooleanLiteral", value: k === "WIN", span: t.span };
    }
    if (k === "NOOB") {
      this.advance();
      return { kind: "NoobLiteral", span: t.span };
    }
    if (k === "IT") {
      this.advance();
      return { kind: "ItReference", span: t.span };
    }
    if (k === "IDENTIFIER") {
      this.advance();
      return { kind: "Identifier", name: t.lexeme, span: t.span };
    }
    if (k === "NOT") {
      this.advance();
      const operand = EXPR.has(typ(this.cur()))
        ? this.expression()
        : this.missing();
      return {
        kind: "UnaryExpression",
        operator: "NOT",
        operand,
        span: span(t.span, operand.span),
      };
    }
    if (OP_TYPES.has(k)) {
      this.advance();
      const left = EXPR.has(typ(this.cur()))
        ? this.expression()
        : this.missing();
      if (!this.match("AN"))
        this.err(
          "SYN006",
          `Expected AN after first operand of ${t.lexeme}.`,
          this.cur().span,
        );
      const right = EXPR.has(typ(this.cur()))
        ? this.expression()
        : this.missing();
      return {
        kind: "BinaryExpression",
        operator: OPS[k],
        left,
        right,
        span: span(t.span, right.span),
      };
    }
    return this.missing();
  }
  private missing(): ExpressionNode {
    const t = this.cur();
    this.err("SYN005", "Expected an expression.", t.span);
    if (!this.end() && !this.sep(t) && !BLOCK.has(typ(t))) this.advance();
    return { kind: "ErrorExpression", span: t.span };
  }
  private err(code: ParserDiagnostic["code"], message: string, s: SourceSpan) {
    this.diagnostics.push({ code, severity: "error", message, span: s });
  }
  private sep(t: T) {
    return typ(t) === "NEWLINE" || typ(t) === "COMMA";
  }
  private seps() {
    let ok = false;
    while (this.sep(this.cur())) {
      this.advance();
      ok = true;
    }
    return ok;
  }
  private sync(types: string[]) {
    while (!this.end() && !types.includes(typ(this.cur()))) this.advance();
  }
  private cur() {
    return this.tokens[Math.min(this.i, this.tokens.length - 1)];
  }
  private prev() {
    return this.tokens[Math.max(0, this.i - 1)];
  }
  private check(k: string) {
    return typ(this.cur()) === k;
  }
  private next(k: string) {
    return typ(this.tokens[Math.min(this.i + 1, this.tokens.length - 1)]) === k;
  }
  private match(k: string) {
    if (!this.check(k)) return false;
    this.advance();
    return true;
  }
  private advance() {
    const t = this.cur();
    if (!this.end()) this.i++;
    return t;
  }
  private end() {
    return this.check("EOF");
  }
}
export function parseTokens(tokens: readonly Token[]): ParseResult {
  return new Parser(tokens).parse();
}
