import { TokenType } from "./token-types";

export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}
export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export type TokenValue = string | number | boolean | null;
export interface Token<T = TokenValue> {
  type: TokenType;
  lexeme: string;
  value?: T;
  span: SourceSpan;
}

export interface LexerResult {
  tokens: Token[];
  diagnostics: LexerDiagnostic[];
}

export type LexerDiagnosticCode =
  "LEX001" | "LEX002" | "LEX003" | "LEX004" | "LEX005";
export interface LexerDiagnostic {
  code: LexerDiagnosticCode;
  severity: "error";
  message: string;
  span: SourceSpan;
}
