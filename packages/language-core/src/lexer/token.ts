import type { SourceSpan } from "./source";
import type { TokenType } from "./token-types";
export type TokenValue = string | number | boolean | null;
export interface Token<T = TokenValue> {
  type: TokenType;
  lexeme: string;
  value?: T;
  span: SourceSpan;
}
