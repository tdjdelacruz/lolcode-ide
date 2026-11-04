import type { LexerDiagnostic } from "./diagnostic";
import type { Token } from "./token";
export interface LexerResult { tokens: Token[]; diagnostics: LexerDiagnostic[]; }
