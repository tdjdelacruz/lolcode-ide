import type { SourceSpan } from "../lexer";
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
  | ConditionalNode
  | ErrorStatementNode;
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
export interface ErrorStatementNode {
  kind: "ErrorStatement";
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
  | BinaryExpressionNode
  | ErrorExpressionNode;
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
export type BinaryOperator =
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
export interface BinaryExpressionNode {
  kind: "BinaryExpression";
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
  span: SourceSpan;
}
export interface ErrorExpressionNode {
  kind: "ErrorExpression";
  span: SourceSpan;
}
