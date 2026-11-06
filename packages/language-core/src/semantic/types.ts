export type SemanticType = "NUMBR" | "NUMBAR" | "YARN" | "TROOF" | "NOOB" | "UNKNOWN";

export interface SymbolInfo {
  name: string;
  type: SemanticType;
  initialized: boolean;
  declarationSpan: import("../lexer").SourceSpan;
}

export type SymbolTable = Map<string, SymbolInfo>;
