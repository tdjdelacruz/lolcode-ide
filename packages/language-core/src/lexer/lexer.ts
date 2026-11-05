import type { LexerResult } from "./result";
import { Scanner } from "./scanner";
export function tokenize(source: string): LexerResult {
  return new Scanner(source).scanTokens();
}
