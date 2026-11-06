import type { ProgramNode } from "../parser";
import type { SemanticDiagnostic } from "./diagnostic";
import type { SymbolInfo } from "./types";

export interface SemanticResult {
  ast: ProgramNode;
  diagnostics: SemanticDiagnostic[];
  symbols: Map<string, SymbolInfo>;
}
