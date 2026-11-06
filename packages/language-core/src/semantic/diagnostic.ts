import type { SourceSpan } from "../lexer";

export type SemanticDiagnosticCode =
  | "SEM001" // duplicate declaration
  | "SEM002" // undeclared variable
  | "SEM003" // use before initialization
  | "SEM004" // assignment to undeclared variable
  | "SEM005" // invalid arithmetic operands
  | "SEM006" // invalid boolean operands
  | "SEM007" // invalid comparison operands
  | "SEM008" // invalid conditional state
  | "SEM009"; // invalid operation involving NOOB

export interface SemanticDiagnostic {
  code: SemanticDiagnosticCode;
  severity: "error" | "warning";
  message: string;
  span: SourceSpan;
}
