import type { LexerDiagnostic } from "../lexer";
import type { ParserDiagnostic } from "../parser";
import type { SemanticDiagnostic } from "../semantic";
import type { AnalysisDiagnostic } from "./results";

export function combineDiagnostics(
  lexerDiagnostics: LexerDiagnostic[],
  parserDiagnostics: ParserDiagnostic[],
  semanticDiagnostics: SemanticDiagnostic[],
): AnalysisDiagnostic[] {
  return [
    ...lexerDiagnostics,
    ...parserDiagnostics,
    ...semanticDiagnostics,
  ].sort((a, b) => {
    return a.span.start.offset - b.span.start.offset;
  });
}
