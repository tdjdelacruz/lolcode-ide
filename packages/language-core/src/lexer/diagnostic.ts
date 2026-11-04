import type { SourceSpan } from "./source";
export type LexerDiagnosticCode = "LEX001" | "LEX002" | "LEX003" | "LEX004" | "LEX005";
export interface LexerDiagnostic {
  code: LexerDiagnosticCode;
  severity: "error";
  message: string;
  span: SourceSpan;
}
