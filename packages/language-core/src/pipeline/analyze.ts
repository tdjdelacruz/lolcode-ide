import { tokenize } from "../lexer";
import { parseTokens } from "../parser";
import { analyze } from "../semantic";

import { combineDiagnostics } from "./diagnostics";
import type { AnalysisResult } from "./results";

export function analyzeSource(source: string): AnalysisResult {
  // Stage 1: Lexical analysis
  const lexerResult = tokenize(source);

  // Stage 2: Syntax analysis
  const parserResult = parseTokens(lexerResult.tokens);

  // Stage 3: Semantic analysis
  const semanticResult = analyze(parserResult.ast);

  // Stage 4: Combine all diagnostics
  const diagnostics = combineDiagnostics(
    lexerResult.diagnostics,
    parserResult.diagnostics,
    semanticResult.diagnostics,
  );

  return {
    source,
    tokens: lexerResult.tokens,
    ast: parserResult.ast,
    diagnostics,
    semantic: {
      symbols: semanticResult.symbols,
    },
    hasErrors: diagnostics.some(
      (diagnostic) => diagnostic.severity === "error",
    ),
  };
}
