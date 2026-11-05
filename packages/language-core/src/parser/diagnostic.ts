import type { SourceSpan } from "../lexer";
export type ParserDiagnosticCode =
  | "SYN001"
  | "SYN002"
  | "SYN003"
  | "SYN004"
  | "SYN005"
  | "SYN006"
  | "SYN007"
  | "SYN008"
  | "SYN009"
  | "SYN010";
export interface ParserDiagnostic {
  code: ParserDiagnosticCode;
  severity: "error" | "warning";
  message: string;
  span: SourceSpan;
}
