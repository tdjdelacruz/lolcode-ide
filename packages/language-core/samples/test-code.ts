import { tokenize } from "../src/lexer";
import { parseTokens } from "../src/parser";

const source = `
HAI 1.3
I HAS A total ITZ SUM OF 10 AN 20
VISIBLE total
KTHXBYE
`;

console.log("IM HERE!");
console.log("SOURCE:", source);

const lexerResult = tokenize(source);
console.log("TOKENS:", lexerResult.tokens);
console.log("LEXER DIAGNOSTICS:", lexerResult.diagnostics);

const parserResult = parseTokens(lexerResult.tokens);

console.log("AST:", parserResult.ast);
console.log("PARSER DIAGNOSTICS:", parserResult.diagnostics);
