# LOLCODE IDE — Semantic Rules

**Status:** MVP implementation contract  
**Language baseline:** LOLCODE 1.3 subset  
**Implementation:** TypeScript semantic analyzer  
**Last updated:** 2026-11-03

## 1. Purpose

This document defines the static meaning rules applied to the AST. The semantic analyzer checks declarations, references, types, operators, implicit `IT`, and conditional structure.

The IDE does not execute programs. The analyzer infers types and reports issues; it does not calculate and run arbitrary program behavior.

## 2. MVP semantic scope

| Feature                                      | Status       | Notes                                                                            |
| -------------------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| Variable declaration and duplicate detection | Supported    | Single program scope in MVP                                                      |
| Undeclared variable detection                | Supported    | Includes reads and writes                                                        |
| Dynamic variable types                       | Supported    | Type may change after assignment                                                 |
| `NOOB` initialization                        | Supported    | Declaration without initializer is NOOB                                          |
| `IT` tracking                                | Supported    | Updated by expression statements, not assignments                                |
| Arithmetic operand validation                | Supported    | Numeric operands required                                                        |
| Boolean operand validation                   | Supported    | TROOF operands required                                                          |
| Comparison validation                        | Supported    | Apply rules below                                                                |
| Conditional `O RLY?`                         | Supported    | Uses inferred type/value category of `IT`                                        |
| Definite assignment analysis                 | Basic        | Warn when a NOOB-initialized variable is read where a concrete value is expected |
| Function scopes, loop scopes                 | Deferred     | Constructs are not in MVP grammar                                                |
| Runtime input values                         | Not analyzed | `GIMMEH` is not executed                                                         |

## 3. Type model

```ts
export type LolType =
  "NUMBR" | "NUMBAR" | "YARN" | "TROOF" | "NOOB" | "UNKNOWN";
```

`UNKNOWN` is an analyzer-internal type used after an error or when inference is not possible. It is not a LOLCODE runtime type.

| Type      | Meaning                         |
| --------- | ------------------------------- |
| `NUMBR`   | Integer numeric value           |
| `NUMBAR`  | Floating-point numeric value    |
| `YARN`    | String value                    |
| `TROOF`   | Boolean value (`WIN` / `FAIL`)  |
| `NOOB`    | Uninitialized / null-like value |
| `UNKNOWN` | Internal recovery type          |

## 4. Symbol table and scope

MVP has one program-level scope because functions and block-local declarations are deferred.

```ts
export interface SymbolInfo {
  name: string;
  type: LolType;
  declaredAt: SourceSpan;
  initialized: boolean;
}

export interface Scope {
  parent?: Scope;
  symbols: Map<string, SymbolInfo>;
}
```

Rules:

1. A variable declaration adds a symbol to the current scope.
2. A second declaration of the same name in the same scope is an error.
3. Identifier reads must resolve to a previously declared symbol.
4. Identifier names are case-sensitive.
5. `IT` is reserved and is not declared in the ordinary symbol table.
6. Declarations inside conditional branches share the MVP program scope. This is a deliberate simplification; duplicate names across branches are therefore duplicate declarations.

## 5. Variable rules

### 5.1 Declaration

`I HAS A name` declares a variable with type `NOOB` and `initialized: false` (or an equivalent uninitialized state).

`I HAS A name ITZ expression` declares and initializes the variable with the inferred type of the expression.

Example:

```lolcode
I HAS A count ITZ 10
I HAS A title ITZ "Hello"
I HAS A ready ITZ WIN
I HAS A pending
```

Expected inferred types: `count: NUMBR`, `title: YARN`, `ready: TROOF`, `pending: NOOB`.

### 5.2 Assignment

`name R expression`:

- requires `name` to have been declared;
- infers the right-hand expression type;
- updates the variable's current inferred type to that type (dynamic typing);
- does not update implicit `IT`.

This is a deliberate MVP semantic rule aligned with LOLCODE's dynamic typing model.

### 5.3 Reads and initialization

- Reading an undeclared variable is an error.
- Reading a declared variable whose current type is `NOOB` is permitted as a value of type `NOOB`; an operation that requires a different type may then report an operand-type error.
- The analyzer may additionally emit a warning for a read of a variable that has never been initialized.
- Do not report the same underlying issue as both an error and a warning.

## 6. Implicit variable `IT`

`IT` is a special implicit temporary value.

MVP rules:

1. `IT` begins as `NOOB`.
2. An expression statement updates `IT` to the inferred type of that expression.
3. An assignment statement does not update `IT`.
4. Variable declaration statements do not update `IT` unless the language behavior is explicitly added in a later version.
5. `O RLY?` branches on the current `IT` value.
6. `VISIBLE`, `GIMMEH`, and other non-expression statements do not update `IT` in the MVP analyzer.

The MVP grammar currently permits expressions as operands within statements but does not include standalone expression statements. If standalone expression statements are added, the parser and semantic analyzer must implement rule 2 explicitly. Until then, `IT` can be set only by any explicitly modeled expression-statement form; otherwise it remains `NOOB`. Document this limitation in the UI.

## 7. Expression typing

### 7.1 Literals

| AST expression  | Inferred type |
| --------------- | ------------- |
| integer literal | `NUMBR`       |
| decimal literal | `NUMBAR`      |
| string literal  | `YARN`        |
| `WIN`, `FAIL`   | `TROOF`       |
| `NOOB`          | `NOOB`        |

Identifier references use the symbol's current inferred type. `IT` uses the current implicit `IT` type.

### 7.2 Numeric operators

Operators: `SUM OF`, `DIFF OF`, `PRODUKT OF`, `QUOSHUNT OF`, `MOD OF`, `BIGGR OF`, `SMALLR OF`.

MVP static rule:

- both operands must be `NUMBR` or `NUMBAR`;
- if either operand is `NUMBAR`, result type is `NUMBAR`;
- otherwise result type is `NUMBR`;
- `QUOSHUNT OF` is typed as `NUMBAR` in the MVP because division may produce a fractional result;
- division by zero cannot generally be determined statically; report only when the right operand is a literal zero.

These are analyzer typing rules, not an execution engine. The implementation should not evaluate arbitrary expressions.

### 7.3 Boolean operators

| Operator    | Arity | Operand requirements | Result  |
| ----------- | ----: | -------------------- | ------- |
| `BOTH OF`   |     2 | `TROOF`, `TROOF`     | `TROOF` |
| `EITHER OF` |     2 | `TROOF`, `TROOF`     | `TROOF` |
| `WON OF`    |     2 | `TROOF`, `TROOF`     | `TROOF` |
| `NOT`       |     1 | `TROOF`              | `TROOF` |

### 7.4 Comparisons

- `BOTH SAEM` and `DIFFRINT` return `TROOF`.
- Numeric pairs (`NUMBR`/`NUMBAR`) are comparable.
- Values of the same nonnumeric type are comparable for equality.
- Mixed unrelated types should produce a semantic diagnostic in the MVP rather than silently coercing.
- If either operand is `UNKNOWN`, suppress cascading comparison errors.

This is a conservative MVP rule. If exact LOLCODE 1.3 coercion behavior is implemented later, update this table and its tests together.

## 8. Input and output

### 8.1 `GIMMEH`

- Target must be a declared variable.
- Since the IDE does not execute programs, the analyzer cannot know the actual input value.
- For static type flow, set the target's inferred type to `YARN`, reflecting that input is read as text.
- Do not simulate prompting or user input.

### 8.2 `VISIBLE`

- Every output argument must be a valid expression.
- `VISIBLE` accepts values of any inferred type in the MVP.
- It does not change variable types or implicit `IT`.
- The analyzer does not produce console output.

## 9. Conditional semantics

`O RLY?` uses implicit `IT`:

- If `IT` is `TROOF`, the conditional is valid.
- For other known types, emit a type diagnostic or warning according to the selected MVP policy. Recommended default: warning for non-`TROOF` values because LOLCODE has truthiness behavior; document the exact truthiness model if it is implemented.
- If `IT` is `UNKNOWN`, avoid cascading diagnostics.
- Analyze both branches.
- Since the MVP has a single shared scope and no control-flow execution, do not claim path-sensitive variable values after the conditional. For variables assigned in either branch, merge their inferred types: preserve the common type if equal, widen numeric `NUMBR`/`NUMBAR` to `NUMBAR`, otherwise use `UNKNOWN` or a documented union strategy.

## 10. Diagnostics

| Code     | Name                         | Severity      | Trigger                                                   |
| -------- | ---------------------------- | ------------- | --------------------------------------------------------- |
| `SEM001` | Undeclared variable          | Error         | Read or assignment target not declared                    |
| `SEM002` | Duplicate declaration        | Error         | Same variable declared twice in one scope                 |
| `SEM003` | Invalid operand type         | Error         | Operator receives unsupported type                        |
| `SEM004` | Invalid comparison           | Error         | Comparison operands are incompatible under MVP rules      |
| `SEM005` | Invalid conditional type     | Warning       | `IT` has a known non-TROOF type at `O RLY?`               |
| `SEM006` | Uninitialized variable read  | Warning       | Variable is read before receiving a non-NOOB value        |
| `SEM007` | Division by zero             | Error         | `QUOSHUNT OF` has a statically known literal zero divisor |
| `SEM008` | Invalid input target         | Error         | `GIMMEH` target is undeclared                             |
| `SEM009` | Unsupported semantic feature | Warning/Error | Deferred feature reaches semantic analysis                |

Each diagnostic must include:

- stable code;
- severity (`error`, `warning`, or `info`);
- concise message;
- source span;
- optional related span (for example, original declaration location).

## 11. Analyzer result contract

```ts
export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  span: SourceSpan;
  relatedInformation?: Array<{
    message: string;
    span: SourceSpan;
  }>;
}

export interface SemanticResult {
  diagnostics: Diagnostic[];
  symbols: SymbolInfo[];
}
```

The semantic analyzer should accept a valid or partially recovered AST and return diagnostics rather than throw for user-authored source errors.

## 12. Examples

### 12.1 Valid

```lolcode
HAI 1.3
I HAS A score ITZ 10
score R SUM OF score AN 5
VISIBLE score
KTHXBYE
```

Expected: no undeclared-variable or operand-type errors.

### 12.2 Undeclared variable

```lolcode
HAI 1.3
VISIBLE score
KTHXBYE
```

Expected: `SEM001` on `score`.

### 12.3 Invalid arithmetic operands

```lolcode
HAI 1.3
I HAS A label ITZ "hello"
I HAS A result ITZ SUM OF label AN 2
KTHXBYE
```

Expected: `SEM003` on the invalid arithmetic expression.

### 12.4 Duplicate declaration

```lolcode
HAI 1.3
I HAS A score
I HAS A score
KTHXBYE
```

Expected: `SEM002` on the second declaration, with related information pointing to the first declaration.

## 13. Acceptance criteria

- Every expression node has a deterministic inferred type.
- Symbol lookup is case-sensitive.
- Duplicate and undeclared variable diagnostics include useful spans.
- Dynamic assignment updates the symbol's inferred type.
- `GIMMEH` updates the target's static type to `YARN`.
- Invalid operands produce one primary diagnostic without excessive cascades.
- Conditional branch analysis does not claim runtime certainty.
- Analyzer tests cover valid and invalid cases for every supported operator.
