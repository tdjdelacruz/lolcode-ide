import type { ProgramNode } from "./ast";
import type { ParserDiagnostic } from "./diagnostic";
export interface ParseResult {
  ast: ProgramNode;
  diagnostics: ParserDiagnostic[];
}
