import type { Token } from "../lexer";
import type { ProgramNode } from "../parser";

export interface AnalysisDiagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  span: {
    start: {
      line: number;
      column: number;
      offset: number;
    };
    end: {
      line: number;
      column: number;
      offset: number;
    };
  };
}

export interface AnalysisResult {
  source: string;
  tokens: Token[];
  ast: ProgramNode;
  diagnostics: AnalysisDiagnostic[];
  semantic: {
    symbols: Map<string, import("../semantic").SymbolInfo>;
  };
  hasErrors: boolean;
}
