import { tokenize } from "../src/lexer";

const source = `
HAI 1.3
I HAS A name ITZ "Trisha"
I HAS A age ITZ 26
VISIBLE name
VISIBLE ages
KTHXBYE
`;

const result = tokenize(source);

console.log("TOKENS:");
console.table(
  result.tokens.map((token) => ({
    type: token.type,
    lexeme: token.lexeme,
    value: token.value,
    line: token.span.start.line,
    column: token.span.start.column,
  })),
);

console.log("DIAGNOSTICS:");
console.table(result.diagnostics);
