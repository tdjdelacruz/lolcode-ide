import type { LexerResult } from "./result";
import { Scanner } from "./scanner";
export function tokenize(source: string): LexerResult {
  return new Scanner(source).scanTokens();
}

const source = `
HAI 1.3
I HAS A age ITZ 26
VISIBLE age
KTHXBYE
`;

const result = tokenize(source);

console.log(result.tokens);
console.log(result.diagnostics);
