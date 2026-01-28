import ts from "typescript";

export const hasModifier = (node: ts.Node, modifier: ts.SyntaxKind) =>
  ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((mod: ts.Modifier) => mod.kind === modifier);

export const isConstEnumSymbol = (symbol: ts.Symbol): boolean => (symbol.flags & ts.SymbolFlags.ConstEnum) !== 0;

export const isConstEnumType = (type: ts.Type | undefined): boolean => {
  if (!type) return false;
  const symbol = type.symbol || type.aliasSymbol;
  if (!symbol) return false;
  return (symbol.flags & ts.SymbolFlags.ConstEnum) !== 0;
};
