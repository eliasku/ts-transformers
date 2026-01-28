import ts from "typescript";

export const isConstEnumSymbol = (symbol: ts.Symbol): boolean => (symbol.flags & ts.SymbolFlags.ConstEnum) !== 0;

export const isConstEnumType = (type: ts.Type | undefined): boolean => {
  if (type) {
    const symbol = type.symbol || type.aliasSymbol;
    if (symbol) {
      return (symbol.flags & ts.SymbolFlags.ConstEnum) !== 0;
    }
  }
  return false;
};
