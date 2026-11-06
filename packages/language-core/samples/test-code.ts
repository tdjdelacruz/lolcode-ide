import { tokenize } from "../src/lexer";
import { parseTokens } from "../src/parser";
import { analyze } from "../src/semantic";

const source = `HAI 1.3
I HAS A total ITZ SUM OF 10 AN 20
VISIBLE total
KTHXBYE`;

const lexerResult = tokenize(source);
const parserResult = parseTokens(lexerResult.tokens);
const semanticResult = analyze(parserResult.ast);

console.log("SEMANTIC DIAGNOSTICS:");
console.log(semanticResult.diagnostics);

console.log("SYMBOL TABLE:");
console.log(semanticResult.symbols);
