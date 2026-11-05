# LOLCODE IDE — Grammar Specification

**Status:** MVP implementation contract  
**Language baseline:** LOLCODE 1.3 subset  
**Implementation:** TypeScript recursive-descent parser  
**Last updated:** 2026-11-03

## 1. Purpose

This document defines the syntax accepted by the MVP parser and the AST shape produced from it. It is intentionally a subset of LOLCODE 1.3. It does not define runtime execution.

The parser consumes tokens from `token-specification.md`. It must:

- validate program structure and statement syntax;
- construct an AST with source spans;
- report syntax errors with useful locations;
- recover where possible so the IDE can show more than one diagnostic.

## 2. MVP syntax coverage

| Construct                              | Status    |
| -------------------------------------- | --------- |
| `HAI 1.3` program header               | Supported |
| `KTHXBYE` program terminator           | Supported |
| Variable declaration: `I HAS A`        | Supported |
| Optional initializer: `ITZ expression` | Supported |
| Assignment: `variable R expression`    | Supported |
| `VISIBLE` output                       | Supported |
| `GIMMEH` input                         | Supported |
| Literals and identifiers               | Supported |
| Prefix arithmetic operators            | Supported |
| Prefix boolean operators               | Supported |
| Equality / inequality                  | Supported |
| `O RLY?` / `YA RLY` / `NO WAI` / `OIC` | Supported |
| `MEBBE` branches                       | Deferred  |
| `WTF?` switch                          | Deferred  |
| Loops and functions                    | Deferred  |
| `SMOOSH`, casts, `SRS`, interpolation  | Deferred  |
| Ellipsis continuation                  | Deferred  |

## 3. Grammar notation

The grammar uses EBNF:

- `A = B, C ;` means sequence.
- `A = B | C ;` means alternatives.
- `[ A ]` means optional.
- `{ A }` means zero or more repetitions.
- Terminals are written in double quotes or as token names.
- `(* ... *)` is a grammar comment.

`separator` is a parser-level abstraction for one or more `NEWLINE` or `COMMA` tokens.

## 4. Program grammar

```ebnf
program
  = HAI, VERSION, separators,
    { statement, separators },
    KTHXBYE, [ separators ], EOF ;

separators
  = separator, { separator } ;

separator
  = NEWLINE | COMMA ;
```

Parser requirements:

- `HAI` and `KTHXBYE` are mandatory.
- MVP version token must be `1.3`.
- The header must be followed by at least one separator.
- The parser accepts blank lines and repeated separators between statements.
- No non-separator token may follow `KTHXBYE`, except EOF.
- The parser should report a missing terminator if EOF occurs before `KTHXBYE`.

## 5. Statement grammar

```ebnf
statement
  = variable_declaration
  | assignment
  | output_statement
  | input_statement
  | conditional_statement ;

variable_declaration
  = I_HAS_A, identifier, [ ITZ, expression ] ;

assignment
  = identifier, R, expression ;

output_statement
  = VISIBLE, output_item, { output_item } ;

output_item
  = expression ;

input_statement
  = GIMMEH, identifier ;
```

`VISIBLE` is variadic in the language. The MVP parser accepts one or more adjacent expressions until a statement separator or block boundary. The parser must use expression-start tokens and expression parsing rules to determine each argument boundary. The optional `!` no-newline output modifier is deferred in this MVP; if later enabled, add a dedicated token and explicit grammar rule.

An assignment target must be an ordinary identifier, not a literal or arbitrary expression. The special `IT` variable is not an ordinary declaration name.

## 6. Expression grammar

LOLCODE expressions are prefix-oriented. The MVP supports literals, variable references, and the operators below.

```ebnf
expression
  = literal
  | variable_reference
  | arithmetic_expression
  | boolean_expression
  | comparison_expression ;

literal
  = NUMBR_LITERAL
  | NUMBAR_LITERAL
  | YARN_LITERAL
  | WIN
  | FAIL
  | NOOB ;

variable_reference
  = identifier
  | IT ;

arithmetic_expression
  = ( SUM_OF | DIFF_OF | PRODUKT_OF | QUOSHUNT_OF
    | MOD_OF | BIGGR_OF | SMALLR_OF ),
    expression, AN, expression ;

boolean_expression
  = ( BOTH_OF | EITHER_OF | WON_OF ),
    expression, AN, expression
  | NOT, expression ;

comparison_expression
  = ( BOTH_SAEM | DIFFRINT ),
    expression, AN, expression ;
```

The grammar is recursive, so nested prefix expressions are valid:

```lolcode
VISIBLE SUM OF 2 AN PRODUKT OF 3 AN 4
```

### 6.1 Expression boundary rule

Because prefix operators do not use parentheses in the MVP, the parser must parse operator arity:

- `NOT` consumes exactly one expression.
- Binary operators consume a left expression, `AN`, and a right expression.
- A literal or identifier consumes one expression.
- Nested operators recursively consume their own operands.

For `VISIBLE`, the parser reads expressions until a separator, block marker, or program terminator. Do not use conventional infix precedence for these prefix forms.

### 6.2 Deferred expression forms

The parser must not accidentally accept deferred forms as valid expressions. Examples include `SMOOSH`, `MAEK`, `IS NOW A`, `ALL OF`, `ANY OF`, and `SRS`. Where possible, emit an unsupported-feature diagnostic distinct from a generic syntax error.

## 7. Conditional grammar

```ebnf
conditional_statement
  = O_RLY, separators,
    YA_RLY, separators,
    { statement, separators },
    [ NO_WAI, separators,
      { statement, separators } ],
    OIC ;
```

Rules:

- The condition is the current value of implicit `IT`; no condition expression follows `O RLY?`.
- `YA RLY` is mandatory.
- `NO WAI` is optional.
- `OIC` is mandatory.
- `MEBBE` is deferred and should be rejected with a clear diagnostic.
- Nested conditionals are permitted.
- A conditional is one statement in its containing statement list.

## 8. AST contract

Every AST node has a source span. Use discriminated unions so parser and semantic analyzer can exhaustively handle node types.

```ts
export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export interface ProgramNode {
  kind: "Program";
  version: "1.3";
  body: StatementNode[];
  span: SourceSpan;
}

export type StatementNode =
  | VariableDeclarationNode
  | AssignmentNode
  | OutputNode
  | InputNode
  | ConditionalNode;

export interface VariableDeclarationNode {
  kind: "VariableDeclaration";
  name: string;
  initializer?: ExpressionNode;
  span: SourceSpan;
}

export interface AssignmentNode {
  kind: "Assignment";
  name: string;
  value: ExpressionNode;
  span: SourceSpan;
}

export interface OutputNode {
  kind: "Output";
  values: ExpressionNode[];
  span: SourceSpan;
}

export interface InputNode {
  kind: "Input";
  name: string;
  span: SourceSpan;
}

export interface ConditionalNode {
  kind: "Conditional";
  thenBody: StatementNode[];
  elseBody: StatementNode[];
  span: SourceSpan;
}

export type ExpressionNode =
  | NumberLiteralNode
  | StringLiteralNode
  | BooleanLiteralNode
  | NoobLiteralNode
  | IdentifierNode
  | ItReferenceNode
  | UnaryExpressionNode
  | BinaryExpressionNode;

export interface NumberLiteralNode {
  kind: "NumberLiteral";
  value: number;
  numericType: "NUMBR" | "NUMBAR";
  span: SourceSpan;
}

export interface StringLiteralNode {
  kind: "StringLiteral";
  value: string;
  span: SourceSpan;
}

export interface BooleanLiteralNode {
  kind: "BooleanLiteral";
  value: boolean;
  span: SourceSpan;
}

export interface NoobLiteralNode {
  kind: "NoobLiteral";
  span: SourceSpan;
}

export interface IdentifierNode {
  kind: "Identifier";
  name: string;
  span: SourceSpan;
}

export interface ItReferenceNode {
  kind: "ItReference";
  span: SourceSpan;
}

export interface UnaryExpressionNode {
  kind: "UnaryExpression";
  operator: "NOT";
  operand: ExpressionNode;
  span: SourceSpan;
}

export interface BinaryExpressionNode {
  kind: "BinaryExpression";
  operator:
    | "SUM_OF"
    | "DIFF_OF"
    | "PRODUKT_OF"
    | "QUOSHUNT_OF"
    | "MOD_OF"
    | "BIGGR_OF"
    | "SMALLR_OF"
    | "BOTH_OF"
    | "EITHER_OF"
    | "WON_OF"
    | "BOTH_SAEM"
    | "DIFFRINT";
  left: ExpressionNode;
  right: ExpressionNode;
  span: SourceSpan;
}
```

If a parser error prevents construction of a normal node, an optional `ErrorExpression` or `ErrorStatement` node may be used for recovery. Keep error nodes out of normal semantic success paths.

## 9. Parser diagnostics and recovery

| Code     | Name                  | Trigger                                             |
| -------- | --------------------- | --------------------------------------------------- |
| `SYN001` | Missing program start | First significant token is not `HAI`                |
| `SYN002` | Missing version       | `HAI` is not followed by `1.3`                      |
| `SYN003` | Missing program end   | EOF before `KTHXBYE`                                |
| `SYN004` | Expected identifier   | Declaration, assignment, or input target is missing |
| `SYN005` | Expected expression   | Operator or statement requires an expression        |
| `SYN006` | Expected `AN`         | Binary prefix operator lacks `AN`                   |
| `SYN007` | Expected block marker | Conditional lacks `YA RLY` or `OIC`                 |
| `SYN008` | Unexpected token      | Token cannot appear at the current grammar position |
| `SYN009` | Unsupported syntax    | A deferred construct is encountered                 |
| `SYN010` | Empty output          | `VISIBLE` has no expression                         |

Recovery strategy:

- At top level, synchronize at `NEWLINE`, `COMMA`, `KTHXBYE`, or a recognized block marker.
- Inside a conditional, synchronize at `YA_RLY`, `NO_WAI`, or `OIC`.
- Do not consume `KTHXBYE` during recovery unless it is being parsed as the terminator.
- Ensure every recovery path advances the token cursor or returns to its caller.

## 10. Example AST

Source:

```lolcode
HAI 1.3
I HAS A total ITZ SUM OF 10 AN 20
VISIBLE total
KTHXBYE
```

Conceptual AST:

```text
Program
└── body
    ├── VariableDeclaration(name="total")
    │   └── initializer: BinaryExpression(SUM_OF)
    │       ├── NumberLiteral(10)
    │       └── NumberLiteral(20)
    └── Output
        └── Identifier(name="total")
```

## 11. Acceptance criteria

- Each grammar production has parser tests.
- Nested prefix expressions parse correctly.
- Nested conditionals parse correctly.
- Missing `AN`, missing operands, and missing `OIC` produce useful diagnostics.
- AST nodes retain exact source spans.
- Parser recovery does not hang or skip the entire remainder of the file unnecessarily.
- Parsing is deterministic and does not mutate the token array.
