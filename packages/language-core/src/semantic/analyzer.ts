import type {
  BinaryExpressionNode,
  ConditionalNode,
  ExpressionNode,
  ProgramNode,
  StatementNode,
} from "../parser";
import type { SourceSpan } from "../lexer";
import type { SemanticDiagnostic, SemanticDiagnosticCode } from "./diagnostic";
import type { SemanticResult } from "./result";
import type { SemanticType, SymbolInfo } from "./types";

export class SemanticAnalyzer {
  private diagnostics: SemanticDiagnostic[] = [];
  private symbols = new Map<string, SymbolInfo>();
  private itType: SemanticType = "NOOB";
  private itInitialized = false;

  analyze(program: ProgramNode): SemanticResult {
    this.diagnostics = [];
    this.symbols = new Map();
    this.itType = "NOOB";
    this.itInitialized = false;

    this.analyzeStatements(program.body);

    return {
      ast: program,
      diagnostics: [...this.diagnostics],
      symbols: new Map(this.symbols),
    };
  }

  private analyzeStatements(statements: StatementNode[]): void {
    for (const statement of statements) this.analyzeStatement(statement);
  }

  private analyzeStatement(statement: StatementNode): void {
    switch (statement.kind) {
      case "VariableDeclaration": {
        if (this.symbols.has(statement.name)) {
          this.report("SEM001", `Variable '${statement.name}' is already declared.`, statement.span);
          if (statement.initializer) this.inferExpression(statement.initializer);
          return;
        }

        const type = statement.initializer
          ? this.inferExpression(statement.initializer)
          : "NOOB";
        this.symbols.set(statement.name, {
          name: statement.name,
          type,
          initialized: Boolean(statement.initializer),
          declarationSpan: statement.span,
        });
        return;
      }

      case "Assignment": {
        const symbol = this.symbols.get(statement.name);
        const valueType = this.inferExpression(statement.value);
        if (!symbol) {
          this.report("SEM004", `Cannot assign to undeclared variable '${statement.name}'.`, statement.span);
          return;
        }
        symbol.type = valueType;
        symbol.initialized = true;
        return;
      }

      case "Output":
        for (const value of statement.values) this.inferExpression(value);
        return;

      case "Input": {
        const symbol = this.symbols.get(statement.name);
        if (!symbol) {
          this.report("SEM002", `Input target '${statement.name}' has not been declared.`, statement.span);
          return;
        }
        // Input is text from the user's perspective; its value is a YARN.
        symbol.type = "YARN";
        symbol.initialized = true;
        return;
      }

      case "Conditional":
        this.analyzeConditional(statement);
        return;

      case "ErrorStatement":
        return;
    }
  }

  private analyzeConditional(node: ConditionalNode): void {
    if (!this.itInitialized) {
      this.report(
        "SEM008",
        "O RLY? is used before IT has received a value in the supported language subset.",
        node.span,
      );
    }

    // Analyze both branches in isolated symbol-table snapshots. A declaration
    // made in one branch is not assumed to exist after the conditional.
    const before = this.cloneSymbols();
    const beforeItType = this.itType;
    const beforeItInitialized = this.itInitialized;

    this.analyzeStatements(node.thenBody);
    const thenSymbols = this.cloneSymbols();

    this.symbols = this.cloneMap(before);
    this.itType = beforeItType;
    this.itInitialized = beforeItInitialized;
    this.analyzeStatements(node.elseBody);
    const elseSymbols = this.cloneSymbols();

    // Keep only symbols that existed before the branch. Merge assignments to
    // existing variables conservatively: retain a type only if both branches
    // agree; otherwise mark it UNKNOWN.
    this.symbols = this.cloneMap(before);
    for (const [name, original] of this.symbols) {
      const thenValue = thenSymbols.get(name);
      const elseValue = elseSymbols.get(name);
      if (!thenValue || !elseValue) continue;
      original.initialized = thenValue.initialized && elseValue.initialized;
      original.type = thenValue.type === elseValue.type ? thenValue.type : "UNKNOWN";
    }
    this.itType = beforeItType;
    this.itInitialized = beforeItInitialized;
  }

  private inferExpression(expression: ExpressionNode): SemanticType {
    switch (expression.kind) {
      case "NumberLiteral":
        return expression.numericType;
      case "StringLiteral":
        return "YARN";
      case "BooleanLiteral":
        return "TROOF";
      case "NoobLiteral":
        return "NOOB";
      case "ErrorExpression":
        return "UNKNOWN";
      case "Identifier": {
        const symbol = this.symbols.get(expression.name);
        if (!symbol) {
          this.report("SEM002", `Variable '${expression.name}' has not been declared.`, expression.span);
          return "UNKNOWN";
        }
        if (!symbol.initialized) {
          this.report("SEM003", `Variable '${expression.name}' is used before it is initialized.`, expression.span);
          return "UNKNOWN";
        }
        return symbol.type;
      }
      case "ItReference":
        if (!this.itInitialized) {
          this.report("SEM008", "IT is read before it has received a value.", expression.span);
          return "UNKNOWN";
        }
        return this.itType;
      case "UnaryExpression": {
        const operandType = this.inferExpression(expression.operand);
        if (operandType !== "TROOF" && operandType !== "UNKNOWN") {
          this.report("SEM006", `NOT expects TROOF; received ${operandType}.`, expression.span);
          return "UNKNOWN";
        }
        return "TROOF";
      }
      case "BinaryExpression":
        return this.inferBinaryExpression(expression);
    }
  }

  private inferBinaryExpression(expression: BinaryExpressionNode): SemanticType {
    const left = this.inferExpression(expression.left);
    const right = this.inferExpression(expression.right);
    if (left === "UNKNOWN" || right === "UNKNOWN") return "UNKNOWN";

    switch (expression.operator) {
      case "SUM_OF":
      case "DIFF_OF":
      case "PRODUKT_OF":
      case "QUOSHUNT_OF":
      case "MOD_OF":
      case "BIGGR_OF":
      case "SMALLR_OF": {
        if (!this.isNumeric(left) || !this.isNumeric(right)) {
          this.report("SEM005", `${expression.operator} expects NUMBR or NUMBAR operands; received ${left} and ${right}.`, expression.span);
          return "UNKNOWN";
        }
        return expression.operator === "QUOSHUNT_OF" || left === "NUMBAR" || right === "NUMBAR"
          ? "NUMBAR"
          : "NUMBR";
      }
      case "BOTH_OF":
      case "EITHER_OF":
      case "WON_OF":
        if (left !== "TROOF" || right !== "TROOF") {
          this.report("SEM006", `${expression.operator} expects TROOF operands; received ${left} and ${right}.`, expression.span);
          return "UNKNOWN";
        }
        return "TROOF";
      case "BOTH_SAEM":
      case "DIFFRINT":
        if (left === "NOOB" || right === "NOOB") {
          this.report("SEM009", `${expression.operator} cannot compare NOOB values in this language subset.`, expression.span);
          return "UNKNOWN";
        }
        if (left !== right && !(this.isNumeric(left) && this.isNumeric(right))) {
          this.report("SEM007", `${expression.operator} compares compatible types; received ${left} and ${right}.`, expression.span);
          return "UNKNOWN";
        }
        return "TROOF";
    }
  }

  private isNumeric(type: SemanticType): boolean {
    return type === "NUMBR" || type === "NUMBAR";
  }

  private report(code: SemanticDiagnosticCode, message: string, span: SourceSpan): void {
    this.diagnostics.push({ code, severity: "error", message, span });
  }

  private cloneSymbols(): Map<string, SymbolInfo> {
    return this.cloneMap(this.symbols);
  }

  private cloneMap(source: Map<string, SymbolInfo>): Map<string, SymbolInfo> {
    return new Map([...source].map(([name, symbol]) => [name, { ...symbol }]));
  }
}

export function analyze(program: ProgramNode): SemanticResult {
  return new SemanticAnalyzer().analyze(program);
}
