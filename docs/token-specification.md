# LOLCODE IDE — Token Specification

**Status:** MVP implementation contract  
**Language baseline:** LOLCODE 1.3, with the supported subset listed below  
**Implementation:** TypeScript lexer  
**Last updated:** 2026-11-03

## 1. Purpose

This document defines how source text is converted into a token stream. The lexer must:

- recognize the supported LOLCODE keywords, identifiers, literals, operators, comments, and separators;
- preserve source locations and offsets for editor diagnostics;
- report lexical errors without crashing;
- avoid deciding whether a token sequence is a valid program (that belongs to the parser).

The IDE performs static analysis only. It does not execute LOLCODE programs.

## 2. MVP feature status

| Feature                                    | Status    | Notes                                      |
| ------------------------------------------ | --------- | ------------------------------------------ |
| `HAI`, `KTHXBYE`, version header           | Supported | MVP accepts `HAI 1.3`                      |
| Variable declaration and assignment        | Supported | `I HAS A`, optional `ITZ`, `R`             |
| `VISIBLE`, `GIMMEH`                        | Supported | Static validation only                     |
| Numeric, string, boolean, `NOOB` literals  | Supported | `NUMBR`, `NUMBAR`, `YARN`, `TROOF`, `NOOB` |
| Arithmetic operators                       | Supported | Prefix binary operators                    |
| Boolean operators                          | Supported | `BOTH OF`, `EITHER OF`, `WON OF`, `NOT`    |
| Equality operators                         | Supported | `BOTH SAEM`, `DIFFRINT`                    |
| `O RLY?` conditional                       | Supported | `YA RLY`, optional `NO WAI`, `OIC`         |
| Single-line comments                       | Supported | `BTW`                                      |
| Multiline comments                         | Supported | `OBTW` ... `TLDR`                          |
| `MEBBE`, `WTF?`, loops, functions          | Deferred  | Not accepted by MVP parser                 |
| Type casts, `SMOOSH`, `SRS`, interpolation | Deferred  | Add only in a later language increment     |
| Ellipsis line continuation (`...`)         | Deferred  | Not treated as a continuation in MVP       |

A deferred construct should produce a clear unsupported-feature diagnostic when practical, rather than being silently misinterpreted.

## 3. Lexical conventions

### 3.1 Character handling

- Source is Unicode text; offsets are UTF-16 code-unit offsets to align with JavaScript and Monaco Editor.
- Line and column positions are 1-based.
- A newline is `\n`, `\r\n`, or `\r`; normalize line counting without changing source offsets.
- Identifiers are case-sensitive.
- MVP keywords are recognized in their canonical uppercase spelling. Lowercase or mixed-case keyword spellings are not keywords.
- Spaces and tabs separate tokens and are otherwise ignored, except inside strings and comments.

### 3.2 Multiword keywords

Recognize multiword keywords using the longest valid keyword match, with word boundaries. Examples:

- `I HAS A` → `I_HAS_A`
- `SUM OF` → `SUM_OF`
- `BOTH SAEM` → `BOTH_SAEM`

Do not match a keyword phrase when its final word is immediately followed by an identifier character. The lexer must preserve the original lexeme and source span.

### 3.3 Statement separators

- A physical newline emits `NEWLINE`.
- A comma is a soft separator in LOLCODE 1.3. For the MVP, commas are accepted as statement separators and emitted as `COMMA`; the parser treats `NEWLINE` and `COMMA` as equivalent separators between top-level statements.
- Repeated separators and separators around comments may be ignored by the parser.
- A newline inside a string is not permitted in the MVP.

## 4. Token model

```ts
export interface SourcePosition {
  line: number; // 1-based
  column: number; // 1-based
  offset: number; // 0-based UTF-16 offset
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition; // exclusive
}

export interface Token<T = unknown> {
  type: TokenType;
  lexeme: string; // exact source text
  value?: T; // decoded value when applicable
  span: SourceSpan;
}
```

The `end` position is exclusive. `value` is populated for literals and version tokens; other tokens may omit it.

## 5. Token catalog

### 5.1 Program and structure

| Token type | Lexeme           |
| ---------- | ---------------- |
| `HAI`      | `HAI`            |
| `KTHXBYE`  | `KTHXBYE`        |
| `VERSION`  | `1.3`            |
| `NEWLINE`  | physical newline |
| `COMMA`    | `,`              |
| `EOF`      | end of source    |

### 5.2 Variables and I/O

| Token type | Lexeme    |
| ---------- | --------- |
| `I_HAS_A`  | `I HAS A` |
| `ITZ`      | `ITZ`     |
| `R`        | `R`       |
| `VISIBLE`  | `VISIBLE` |
| `GIMMEH`   | `GIMMEH`  |
| `IT`       | `IT`      |

`IT` is a special implicit variable. It is tokenized separately from ordinary identifiers.

### 5.3 Literals

| Token type       | Lexeme / form   | Value                  |
| ---------------- | --------------- | ---------------------- |
| `NUMBR_LITERAL`  | `0`, `42`, `-7` | integer number         |
| `NUMBAR_LITERAL` | `3.14`, `-0.5`  | floating-point number  |
| `YARN_LITERAL`   | `"hello"`       | decoded string         |
| `WIN`            | `WIN`           | `true`                 |
| `FAIL`           | `FAIL`          | `false`                |
| `NOOB`           | `NOOB`          | `null` / NOOB sentinel |

Numeric lexical form:

- `NUMBR`: `-?(0|[1-9][0-9]*)`
- `NUMBAR`: `-?(0|[1-9][0-9]*)\.[0-9]+`
- A leading `+` is not part of an MVP numeric literal.
- A decimal point must have digits on both sides.
- Exponential notation is deferred.

The scanner should prefer the longest numeric match. A malformed numeric-looking sequence should produce a lexical diagnostic rather than being split into misleading valid tokens.

### 5.4 Arithmetic operators

| Token type    | Lexeme        |
| ------------- | ------------- |
| `SUM_OF`      | `SUM OF`      |
| `DIFF_OF`     | `DIFF OF`     |
| `PRODUKT_OF`  | `PRODUKT OF`  |
| `QUOSHUNT_OF` | `QUOSHUNT OF` |
| `MOD_OF`      | `MOD OF`      |
| `BIGGR_OF`    | `BIGGR OF`    |
| `SMALLR_OF`   | `SMALLR OF`   |

### 5.5 Boolean and comparison operators

| Token type  | Lexeme      |
| ----------- | ----------- |
| `BOTH_OF`   | `BOTH OF`   |
| `EITHER_OF` | `EITHER OF` |
| `WON_OF`    | `WON OF`    |
| `NOT`       | `NOT`       |
| `BOTH_SAEM` | `BOTH SAEM` |
| `DIFFRINT`  | `DIFFRINT`  |
| `AN`        | `AN`        |

### 5.6 Conditional keywords

| Token type | Lexeme   |
| ---------- | -------- |
| `O_RLY`    | `O RLY?` |
| `YA_RLY`   | `YA RLY` |
| `NO_WAI`   | `NO WAI` |
| `OIC`      | `OIC`    |

### 5.7 Comments

Comments are recognized and discarded by the lexer in the MVP. They do not appear in the parser token stream. If editor highlighting later requires comments, add a separate trivia channel without changing parser-visible token semantics.

- `BTW` begins a single-line comment through the end of the physical line.
- `OBTW` begins a multiline comment.
- `TLDR` ends a multiline comment.
- Multiline comments may span lines.
- An `OBTW` without a matching `TLDR` produces `LEX003`.

## 6. Identifiers

Identifier pattern:

```regex
[A-Za-z][A-Za-z0-9_]*
```

Rules:

- The first character must be an ASCII letter.
- Subsequent characters may be ASCII letters, digits, or underscores.
- Identifiers are case-sensitive: `score` and `Score` are different names.
- Reserved keywords cannot be used as ordinary identifiers.
- `IT` is reserved for the implicit variable.

Examples:

| Text       | Result                                                                                         |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `score`    | valid identifier                                                                               |
| `player_2` | valid identifier                                                                               |
| `A1`       | valid identifier                                                                               |
| `_score`   | invalid identifier                                                                             |
| `2players` | numeric token followed by identifier or malformed numeric diagnostic, depending on exact input |

## 7. String literals

MVP string syntax uses double quotes. The lexer must decode these escapes:

| Source escape | Decoded character |
| ------------- | ----------------- |
| `:)`          | newline           |
| `:>`          | tab               |
| `:o`          | bell              |
| `:"`          | double quote      |
| `::`          | colon             |

Other LOLCODE 1.3 escape forms, including Unicode and variable interpolation, are deferred. Unknown escape sequences produce `LEX002` in strict MVP mode. A missing closing quote produces `LEX001`.

Example:

```lolcode
VISIBLE "Hello:>world"
```

The token's `lexeme` retains the exact source spelling; `value` contains the decoded string.

## 8. Lexical diagnostics

| Code     | Name                       | Trigger                                    | Suggested message                    |
| -------- | -------------------------- | ------------------------------------------ | ------------------------------------ |
| `LEX001` | Unterminated string        | No closing quote before line end or EOF    | `Unterminated string literal.`       |
| `LEX002` | Invalid string escape      | Unsupported escape sequence                | `Unsupported escape sequence ':x'.`  |
| `LEX003` | Unterminated block comment | `OBTW` has no `TLDR`                       | `Multiline comment is missing TLDR.` |
| `LEX004` | Invalid character          | Character cannot begin any token           | `Unexpected character '<char>'.`     |
| `LEX005` | Malformed number           | Numeric-looking text violates numeric form | `Malformed numeric literal.`         |

Diagnostics must include a source span. The lexer should continue scanning after recoverable errors.

## 9. Lexer behavior and recovery

1. Skip spaces and tabs.
2. Recognize comments before ordinary identifiers so `BTW` and `OBTW` are handled correctly.
3. Recognize multiword keywords using longest match and word boundaries.
4. Recognize string literals before scanning punctuation inside them.
5. Recognize numeric literals.
6. Recognize identifiers and single-word keywords.
7. Emit separators.
8. Emit `EOF` exactly once.

When an invalid character is encountered, report it and advance at least one Unicode code point (while keeping offsets in UTF-16 units) to prevent an infinite loop.

## 10. Example tokenization

Input:

```lolcode
HAI 1.3
I HAS A age ITZ 26
VISIBLE age
KTHXBYE
```

Expected significant token sequence:

```text
HAI
VERSION(value=1.3)
NEWLINE
I_HAS_A
IDENTIFIER(value="age")
ITZ
NUMBR_LITERAL(value=26)
NEWLINE
VISIBLE
IDENTIFIER(value="age")
NEWLINE
KTHXBYE
EOF
```

Whitespace is not emitted. Comments are discarded. The parser may normalize separator runs.

## 11. Acceptance criteria

- Every token in Sections 5–7 has unit tests for valid recognition.
- Multiword keywords are tested with varied whitespace and identifier-boundary cases.
- Every lexical diagnostic has at least one positive test.
- Token spans point to the exact original source text.
- The lexer always terminates, including malformed input.
- The same source produces deterministic tokens and diagnostics.
