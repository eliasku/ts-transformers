import ts from "typescript";
import { ConstEnumRegistry } from "./registry";
import { EnumEvaluator } from "./evaluator";
import { hasModifier, isConstEnumType } from "./utils";
import { LOGS } from "../config";

export const tsTransformConstEnums = (
  program: ts.Program,
  entrySourceFiles?: readonly string[],
): ts.TransformerFactory<ts.SourceFile> => {
  if (LOGS) {
    console.log("[const-enum] tsTransformConstEnums called!");
  }
  const startTime = performance.now();
  const registry = new ConstEnumRegistry(program, entrySourceFiles);
  const typeChecker = program.getTypeChecker();
  const evaluator = new EnumEvaluator(typeChecker);
  if (LOGS) {
    console.log(
      `[const-enum] Found ${registry.getEnumCount()} const enum declarations in ${performance.now() - startTime}ms`,
    );
  }

  return (context: ts.TransformationContext) => {
    function transformNodeAndChildren(
      node: ts.Node,
      ctx: ts.TransformationContext,
      sourceFile: ts.SourceFile,
    ): ts.Node {
      return ts.visitEachChild(
        transformNode(node, sourceFile, ctx, registry, evaluator, typeChecker),
        (childNode: ts.Node) => transformNodeAndChildren(childNode, ctx, sourceFile),
        ctx,
      );
    }
    return (sourceFile: ts.SourceFile) => transformNodeAndChildren(sourceFile, context, sourceFile) as ts.SourceFile;
  };
};

function transformNode(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  ctx: ts.TransformationContext,
  registry: ConstEnumRegistry,
  evaluator: EnumEvaluator,
  typeChecker: ts.TypeChecker,
): ts.Node {
  if (ts.isPropertyAccessExpression(node)) {
    return transformPropertyAccess(node, ctx, registry, evaluator, typeChecker);
  }

  if (ts.isEnumDeclaration(node)) {
    return transformEnumDeclaration(node, sourceFile, ctx);
  }

  if (ts.isImportSpecifier(node)) {
    return transformImportSpecifier(node, ctx, registry, typeChecker);
  }

  if (ts.isImportClause(node)) {
    return transformImportClause(node, ctx, registry, typeChecker);
  }

  return ts.visitEachChild(
    node,
    (child) => transformNode(child, sourceFile, ctx, registry, evaluator, typeChecker),
    ctx,
  );
}

function transformPropertyAccess(
  node: ts.PropertyAccessExpression,
  ctx: ts.TransformationContext,
  registry: ConstEnumRegistry,
  evaluator: EnumEvaluator,
  typeChecker: ts.TypeChecker,
): ts.Expression | ts.PropertyAccessExpression {
  const expressionType = typeChecker.getTypeAtLocation(node.expression);

  if (!isConstEnumType(expressionType)) {
    return node;
  }

  const enumSymbol = expressionType.symbol || expressionType.aliasSymbol;
  if (!enumSymbol) {
    return node;
  }

  const enumInfo = registry.getEnumInfo(enumSymbol);
  if (!enumInfo) {
    if (LOGS) {
      console.warn(`[const-enum] Could not find const enum ${enumSymbol.name}`);
    }
    return node;
  }

  const memberValue = enumInfo.members.get(node.name.text)?.value;
  if (memberValue === undefined || memberValue === null) {
    if (LOGS) {
      console.warn(`[const-enum] Could not find member ${enumSymbol.name}.${node.name.text}`);
    }
    return node;
  }

  const literal = evaluator.createLiteral(memberValue);
  if (LOGS) {
    console.log(`[const-enum] Inline ${enumSymbol.name}.${node.name.text} → ${JSON.stringify(memberValue)}`);
  }

  return literal;
}

function transformEnumDeclaration(
  node: ts.EnumDeclaration,
  sourceFile: ts.SourceFile,
  ctx: ts.TransformationContext,
): ts.EnumDeclaration | undefined {
  // unused
  void ctx;

  if (!hasModifier(node, ts.SyntaxKind.ConstKeyword)) {
    return node;
  }

  if (sourceFile.isDeclarationFile) {
    if (LOGS) {
      console.log(`[const-enum] Strip 'const' from ${node.name.text} in ${sourceFile.fileName}`);
    }
    return ts.factory.updateEnumDeclaration(
      node,
      node.modifiers?.filter((m) => m.kind !== ts.SyntaxKind.ConstKeyword),
      node.name,
      node.members,
    );
  }

  if (LOGS) {
    console.log(`[const-enum] Remove const enum declaration ${node.name.text} in ${sourceFile.fileName}`);
  }
  return undefined;
}

function transformImportSpecifier(
  node: ts.ImportSpecifier,
  ctx: ts.TransformationContext,
  registry: ConstEnumRegistry,
  typeChecker: ts.TypeChecker,
): ts.ImportSpecifier | undefined {
  const importedType = typeChecker.getTypeAtLocation(node);

  if (isConstEnumType(importedType)) {
    if (LOGS) {
      console.log(`[const-enum] Remove import of const enum ${importedType.symbol?.name}`);
    }
    return undefined;
  }

  return node;
}

function transformImportClause(
  node: ts.ImportClause,
  ctx: ts.TransformationContext,
  registry: ConstEnumRegistry,
  typeChecker: ts.TypeChecker,
): ts.ImportClause | undefined {
  if (!node.name) {
    return node;
  }

  const type = typeChecker.getTypeAtLocation(node.name);

  if (isConstEnumType(type)) {
    if (LOGS) {
      console.log(`[const-enum] Remove import clause for const enum ${type.symbol?.name}`);
    }
    return undefined;
  }

  return node;
}
