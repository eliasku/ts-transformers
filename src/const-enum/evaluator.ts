import ts from "typescript";

export type EnumValue = string | number;

export interface EvaluationContext {
  localMembers: Map<string, EnumValue>;
  allowEnumReferences: boolean;
}

export class EnumEvaluator {
  private lastImplicitValue = -1;
  private enumType: "numeric" | "string" | "mixed" = "numeric";

  constructor(private readonly typeChecker: ts.TypeChecker) {}

  reset(): void {
    this.lastImplicitValue = -1;
    this.enumType = "numeric";
  }

  evaluate(expr: ts.Expression, context: EvaluationContext): EnumValue {
    if (ts.isPrefixUnaryExpression(expr)) {
      return this.evaluateUnary(expr, context);
    } else if (ts.isBinaryExpression(expr)) {
      return this.evaluateBinary(expr, context);
    } else if (ts.isStringLiteralLike(expr)) {
      return expr.text;
    } else if (ts.isNumericLiteral(expr)) {
      return +expr.text;
    } else if (ts.isParenthesizedExpression(expr)) {
      return this.evaluate(expr.expression, context);
    } else if (ts.isIdentifier(expr)) {
      return this.evaluateIdentifier(expr, context);
    } else if (
      expr.kind === ts.SyntaxKind.TrueKeyword ||
      expr.kind === ts.SyntaxKind.FalseKeyword ||
      expr.kind === ts.SyntaxKind.NullKeyword
    ) {
      throw this.createError(expr, `Unsupported literal: ${ts.SyntaxKind[expr.kind]}`);
    }

    throw this.createError(expr, `Cannot evaluate expression: ${expr.getText()}`);
  }

  evaluateEnumMember(member: ts.EnumMember, context: EvaluationContext): EnumValue {
    if (!member.initializer) {
      return this.evaluateImplicitMember(member);
    }

    const value = this.evaluate(member.initializer, context);

    if (typeof value === "number") {
      this.lastImplicitValue = value;
    }

    return value;
  }

  private evaluateImplicitMember(member: ts.EnumMember): EnumValue {
    const name = ts.isIdentifier(member.name) ? member.name.text : `<computed>`;
    // unused
    void name;

    if (this.lastImplicitValue === -1) {
      this.lastImplicitValue = 0;
      return 0;
    }

    const nextValue = this.lastImplicitValue + 1;
    this.lastImplicitValue = nextValue;
    return nextValue;
  }

  createLiteral(value: EnumValue): ts.Expression {
    if (typeof value === "string") {
      return ts.factory.createStringLiteral(value);
    } else {
      if (value < 0) {
        return ts.factory.createPrefixMinus(ts.factory.createNumericLiteral(Math.abs(value).toString()));
      }
      return ts.factory.createNumericLiteral(value.toString());
    }
  }

  private evaluateUnary(expr: ts.PrefixUnaryExpression, context: EvaluationContext): number {
    const value = this.evaluate(expr.operand, context);
    if (typeof value !== "number") {
      throw this.createError(expr, `Unary operator requires numeric value, got ${typeof value}`);
    }

    switch (expr.operator) {
      case ts.SyntaxKind.PlusToken:
        return value;
      case ts.SyntaxKind.MinusToken:
        return -value;
      case ts.SyntaxKind.TildeToken:
        return ~value;
      default:
        throw this.createError(expr, `Unsupported unary operator: ${ts.SyntaxKind[expr.operator]}`);
    }
  }

  private evaluateBinary(expr: ts.BinaryExpression, context: EvaluationContext): EnumValue {
    const left = this.evaluate(expr.left, context);
    const right = this.evaluate(expr.right, context);

    // String concatenation
    if (typeof left === "string" && typeof right === "string" && expr.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      return left + right;
    }

    // Numeric operations
    if (typeof left === "number" && typeof right === "number") {
      switch (expr.operatorToken.kind) {
        case ts.SyntaxKind.BarToken:
          return left | right;
        case ts.SyntaxKind.AmpersandToken:
          return left & right;
        case ts.SyntaxKind.GreaterThanGreaterThanToken:
          return left >> right;
        case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
          return left >>> right;
        case ts.SyntaxKind.LessThanLessThanToken:
          return left << right;
        case ts.SyntaxKind.CaretToken:
          return left ^ right;
        case ts.SyntaxKind.AsteriskToken:
          return left * right;
        case ts.SyntaxKind.SlashToken:
          return left / right;
        case ts.SyntaxKind.PlusToken:
          return left + right;
        case ts.SyntaxKind.MinusToken:
          return left - right;
        case ts.SyntaxKind.PercentToken:
          return left % right;
        case ts.SyntaxKind.AsteriskAsteriskToken:
          return left ** right;
        default:
          throw this.createError(expr, `Unsupported binary operator: ${ts.SyntaxKind[expr.operatorToken.kind]}`);
      }
    }

    throw this.createError(expr, `Cannot evaluate binary expression with types ${typeof left} and ${typeof right}`);
  }

  private evaluateIdentifier(expr: ts.Identifier, context: EvaluationContext): EnumValue {
    if (!context.allowEnumReferences) {
      throw this.createError(expr, `Cannot reference enum member here`);
    }

    const value = context.localMembers.get(expr.text);
    if (value === undefined) {
      throw this.createError(expr, `Undefined enum member: ${expr.text}`);
    }

    return value;
  }

  private createError(node: ts.Node, message: string): Error {
    const sourceFile = node.getSourceFile();
    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return new Error(`${sourceFile.fileName}:${pos.line + 1}:${pos.character}: ${message}`);
  }
}
