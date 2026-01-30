import ts from "typescript";

import {
  getActualSymbol,
  splitTransientSymbol,
  isClassMember,
  hasPrivateKeyword,
  getExportsForSourceFile,
  getDeclarationsForSymbol,
} from "../utils/symbol-utils";
import { LOGS } from "../config";

export class ExportsSymbolTree {
  private readonly program: ts.Program;
  private readonly exportsTree = new Map<ts.Symbol, Set<ts.Symbol>>();

  constructor(program: ts.Program, entrySourceFiles: readonly string[]) {
    this.program = program;
    this.computeTreeForExports(entrySourceFiles);
  }

  isSymbolAccessibleFromExports(symbol: ts.Symbol): boolean {
    symbol = this.getActualSymbol(symbol);
    for (const [, set] of this.exportsTree) {
      if (set.has(symbol)) {
        return true;
      }
    }
    return false;
  }

  private computeTreeForExports(entrySourceFiles: readonly string[]): void {
    this.exportsTree.clear();

    const typeChecker = this.program.getTypeChecker();
    for (const filePath of entrySourceFiles) {
      const sourceFile = this.program.getSourceFile(filePath);
      if (sourceFile === undefined) {
        throw new Error(`Cannot find source file ${filePath}`);
      }

      const entrySourceFile = typeChecker.getSymbolAtLocation(sourceFile);
      if (entrySourceFile === undefined) {
        // if a source file doesn't have any export - then it doesn't have a symbol as well
        // so just skip it here
        continue;
      }

      if (LOGS) {
        console.log(`[ExportsSymbolTree] Processing entry file: ${filePath}`);
      }
      for (const entryExportSymbol of getExportsForSourceFile(typeChecker, entrySourceFile)) {
        if (LOGS) {
          console.log(`[ExportsSymbolTree]   Export symbol: ${entryExportSymbol.escapedName}`);
        }
        const exportSymbolsSet = new Set<ts.Symbol>();
        this.exportsTree.set(entryExportSymbol, exportSymbolsSet);

        for (const exportDeclaration of getDeclarationsForSymbol(entryExportSymbol)) {
          if (LOGS) {
            console.log(
              `[ExportsSymbolTree]     Declaration: ${ts.SyntaxKind[exportDeclaration.kind]} - ${exportDeclaration.getText()}`,
            );
          }
          this.computeTreeForChildren(exportSymbolsSet, exportDeclaration, new Set<ts.Symbol>());
        }
      }
    }
  }

  private computeTreeForChildren(
    targetSymbolsSet: Set<ts.Symbol>,
    node: ts.Node,
    visitedSymbols: Set<ts.Symbol>,
  ): void {
    if (LOGS) {
      console.log(`[computeTreeForChildren] Processing: ${ts.SyntaxKind[node.kind]} - ${node.getText()}`);
    }

    // Handle namespace exports (export * as name from './module')
    // These create an alias symbol that points to the actual module symbol
    if (ts.isNamespaceExport(node)) {
      if (LOGS) {
        console.log(`[computeTreeForChildren]   Found NamespaceExport!`);
      }
      const typeChecker = this.program.getTypeChecker();

      // Get the symbol at the namespace export's name (e.g., "fun1" in "export * as fun1 from './module'")
      const symbol = typeChecker.getSymbolAtLocation(node.name);
      if (LOGS) {
        console.log(
          `[computeTreeForChildren]   Symbol: ${symbol?.name}, isAlias: ${symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0}`,
        );
      }
      if (symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias) {
        // Resolve the alias to get the actual module symbol
        const aliasedSymbol = typeChecker.getAliasedSymbol(symbol);
        if (LOGS) {
          console.log(`[computeTreeForChildren]   Aliased to: ${aliasedSymbol.escapedName}`);
        }

        // Get all exports from the referenced module
        const moduleExports = typeChecker.getExportsOfModule(aliasedSymbol);
        if (moduleExports && moduleExports.length > 0) {
          if (LOGS) {
            console.log(`[computeTreeForChildren]   Module exports: ${moduleExports.map((e) => e.name).join(", ")}`);
          }
          for (const exportSymbol of moduleExports) {
            const actualExport = getActualSymbol(exportSymbol, typeChecker);
            if (!visitedSymbols.has(actualExport)) {
              visitedSymbols.add(actualExport);
              targetSymbolsSet.add(actualExport);
              if (LOGS) {
                console.log(`[computeTreeForChildren]     Adding: ${actualExport.escapedName}`);
              }

              for (const exportDeclaration of getDeclarationsForSymbol(actualExport)) {
                this.computeTreeForChildren(targetSymbolsSet, exportDeclaration, visitedSymbols);
              }
            }
          }
        } else {
          console.warn(`[computeTreeForChildren]   Could not get exports for aliased symbol`);
        }
      }
      return;
    }

    // Handle re-export of namespace imports (import * as x from './module'; export { x })
    // This pattern creates an export that references a namespace import
    if (ts.isExportDeclaration(node) && node.exportClause !== undefined && ts.isNamedExports(node.exportClause)) {
      if (LOGS) {
        console.log(`[computeTreeForChildren]   Found ExportDeclaration with named exports`);
      }
      const typeChecker = this.program.getTypeChecker();

      for (const exportSpecifier of node.exportClause.elements) {
        if (LOGS) {
          console.log(`[computeTreeForChildren]     Export specifier: ${exportSpecifier.name.text}`);
        }
        // Get the symbol for this exported name
        const exportedSymbol = typeChecker.getSymbolAtLocation(exportSpecifier.name);
        if (exportedSymbol !== undefined) {
          if (LOGS) {
            console.log(
              `[computeTreeForChildren]       Symbol: ${exportedSymbol.name}, flags: ${exportedSymbol.flags}`,
            );
          }

          // Check if this is an alias (e.g., from a namespace import)
          if ((exportedSymbol.flags & ts.SymbolFlags.Alias) !== 0) {
            const aliasedSymbol = typeChecker.getAliasedSymbol(exportedSymbol);
            if (LOGS) {
              console.log(
                `[computeTreeForChildren]       Aliased to: ${aliasedSymbol.name}, flags: ${aliasedSymbol.flags}`,
              );
            }

            // Check if the aliased symbol is a namespace module
            if ((aliasedSymbol.flags & ts.SymbolFlags.NamespaceModule) !== 0) {
              if (LOGS) {
                console.log(`[computeTreeForChildren]       Aliased symbol is a namespace module!`);
              }
              // Get all exports from this namespace module
              const moduleExports = typeChecker.getExportsOfModule(aliasedSymbol);
              if (LOGS) {
                console.log(
                  `[computeTreeForChildren]       Module exports: ${moduleExports.map((e) => e.name).join(", ")}`,
                );
              }
              for (const exportSymbol of moduleExports) {
                const actualExport = getActualSymbol(exportSymbol, typeChecker);
                if (!visitedSymbols.has(actualExport)) {
                  visitedSymbols.add(actualExport);
                  targetSymbolsSet.add(actualExport);
                  if (LOGS) {
                    console.log(`[computeTreeForChildren]         Adding: ${actualExport.escapedName}`);
                  }

                  // Recursively process the export's declarations
                  for (const exportDeclaration of getDeclarationsForSymbol(actualExport)) {
                    this.computeTreeForChildren(targetSymbolsSet, exportDeclaration, visitedSymbols);
                  }
                }
              }
            }
          }
        }
      }
      // Don't return here - continue to process children
    }

    // it's similar to handling ts.Block node - both Block and variable's initializer are part of _implementation_
    // and we don't care about that implementation at all - we just only need to worry it's definition
    // for functions it is arguments and return type
    // for variables - the type of a variable
    if (ts.isVariableDeclaration(node)) {
      const typeChecker = this.program.getTypeChecker();
      const variableType = typeChecker.getTypeAtLocation(node);
      const variableTypeSymbol = variableType.getSymbol();
      if (variableTypeSymbol !== undefined) {
        targetSymbolsSet.add(variableTypeSymbol);
        if (LOGS) {
          console.log(`[computeTreeForChildren]   Added variable type symbol: ${variableTypeSymbol.escapedName}`);
        }
      }

      return;
    }

    ts.forEachChild(node, (childNode: ts.Node) => this.computeTreeForNode(targetSymbolsSet, childNode, visitedSymbols));
  }

  private computeTreeForNode(targetSymbolsSet: Set<ts.Symbol>, node: ts.Node, visitedSymbols: Set<ts.Symbol>): void {
    if (ts.isVariableStatement(node)) {
      for (const varDeclaration of node.declarationList.declarations) {
        this.computeTreeForNode(targetSymbolsSet, varDeclaration, visitedSymbols);
      }

      return;
    }

    if (node.kind === ts.SyntaxKind.JSDoc || ts.isBlock(node)) {
      return;
    }

    if (isClassMember(node) && hasPrivateKeyword(node)) {
      return;
    }

    if (ts.isIdentifier(node)) {
      const symbol = this.getSymbol(node);
      if (symbol === null) {
        return;
      }

      if (visitedSymbols.has(symbol)) {
        return;
      }

      visitedSymbols.add(symbol);
      if (LOGS) {
        console.log(`[computeTreeForNode]   Processing identifier: ${node.getText()} -> ${symbol.escapedName}`);
      }

      for (const childSymbol of splitTransientSymbol(symbol, this.program.getTypeChecker())) {
        targetSymbolsSet.add(childSymbol);
        if (LOGS) {
          console.log(`[computeTreeForNode]     Added to set: ${childSymbol.escapedName}`);
        }

        for (const exportDeclaration of getDeclarationsForSymbol(childSymbol)) {
          this.computeTreeForChildren(targetSymbolsSet, exportDeclaration, visitedSymbols);
        }
      }
    }

    this.computeTreeForChildren(targetSymbolsSet, node, visitedSymbols);
  }

  private getSymbol(node: ts.Node): ts.Symbol | null {
    const nodeSymbol = this.program.getTypeChecker().getSymbolAtLocation(node);
    if (nodeSymbol === undefined) {
      return null;
    }

    return this.getActualSymbol(nodeSymbol);
  }

  private getActualSymbol(symbol: ts.Symbol): ts.Symbol {
    return getActualSymbol(symbol, this.program.getTypeChecker());
  }
}
