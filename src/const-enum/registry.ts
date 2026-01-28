import ts from "typescript";
import { EnumValue, EvaluationContext } from "./evaluator";
import { EnumEvaluator } from "./evaluator";
import { hasModifier, isConstEnumSymbol } from "./utils";

export interface ConstEnumInfo {
  declaration: ts.EnumDeclaration;
  members: Map<string, ConstEnumMemberInfo>;
  isExported: boolean;
  sourceFile: ts.SourceFile;
}

export interface ConstEnumMemberInfo {
  declaration: ts.EnumMember;
  name: string;
  value: EnumValue | null;
}

export class ConstEnumRegistry {
  private readonly program: ts.Program;
  private readonly typeChecker: ts.TypeChecker;
  private readonly entrySourceFiles: readonly string[];
  private readonly enumDeclarations: Map<string, ConstEnumInfo>;

  constructor(program: ts.Program, entrySourceFiles?: readonly string[]) {
    this.program = program;
    this.typeChecker = program.getTypeChecker();
    this.entrySourceFiles = entrySourceFiles || program.getRootFileNames();
    this.enumDeclarations = new Map();
    this.collectConstEnumsFromEntryPoints();
  }

  getEnum(enumName: string): ConstEnumInfo | undefined {
    return this.enumDeclarations.get(enumName);
  }

  getEnumInfo(symbol: ts.Symbol): ConstEnumInfo | undefined {
    const name = this.getEnumSymbolName(symbol);
    return this.enumDeclarations.get(name);
  }

  getMemberValue(enumName: string, memberName: string): EnumValue | undefined {
    const enumInfo = this.enumDeclarations.get(enumName);
    if (!enumInfo) return undefined;
    const memberInfo = enumInfo.members.get(memberName);
    return memberInfo?.value ?? undefined;
  }

  getAllEnums(): ConstEnumInfo[] {
    return Array.from(this.enumDeclarations.values());
  }

  getEnumCount(): number {
    return this.enumDeclarations.size;
  }

  private collectConstEnumsFromEntryPoints(): void {
    const sourceFiles = this.program.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      if (sourceFile.isDeclarationFile) {
        continue;
      }

      this.registerConstEnumFromSource(sourceFile);
    }
  }

  private registerConstEnumFromSource(sourceFile: ts.SourceFile): void {
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isEnumDeclaration(node) && hasModifier(node, ts.SyntaxKind.ConstKeyword)) {
        const symbol = this.typeChecker.getSymbolAtLocation(node.name);
        if (symbol && isConstEnumSymbol(symbol)) {
          this.registerEnum(symbol, node, sourceFile);
        }
      }
    });
  }

  private registerEnum(symbol: ts.Symbol, declaration: ts.EnumDeclaration, sourceFile: ts.SourceFile): void {
    const name = this.getEnumSymbolName(symbol);

    if (this.enumDeclarations.has(name)) {
      return;
    }

    const isExported = this.hasExportModifier(declaration);

    const enumInfo: ConstEnumInfo = {
      declaration,
      members: new Map(),
      isExported,
      sourceFile,
    };

    this.evaluateEnumMembers(enumInfo);

    this.enumDeclarations.set(name, enumInfo);
  }

  private hasExportModifier(node: ts.Node): boolean {
    if (!ts.canHaveModifiers(node)) {
      return false;
    }
    const modifiers = ts.getModifiers(node);
    if (!modifiers) {
      return false;
    }
    return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  private evaluateEnumMembers(enumInfo: ConstEnumInfo): void {
    const evaluator = new EnumEvaluator(this.typeChecker);
    evaluator.reset();
    const context: EvaluationContext = {
      localMembers: new Map(),
      allowEnumReferences: true,
    };

    for (const member of enumInfo.declaration.members) {
      if (!ts.isIdentifier(member.name)) continue;

      try {
        const value = evaluator.evaluateEnumMember(member, context);
        context.localMembers.set(member.name.text, value);
        enumInfo.members.set(member.name.text, {
          declaration: member,
          name: member.name.text,
          value,
        });
      } catch (error) {
        throw new Error(
          `Failed to evaluate const enum member ${enumInfo.declaration.name.text}.${member.name.text}: ${error}`,
        );
      }
    }
  }

  private getEnumDeclaration(symbol: ts.Symbol): ts.EnumDeclaration | null {
    const decl = symbol.declarations?.[0];
    if (decl && ts.isEnumDeclaration(decl)) {
      return decl;
    }
    return null;
  }

  private getEnumSymbolName(symbol: ts.Symbol): string {
    if (symbol.flags & ts.SymbolFlags.Alias) {
      return this.typeChecker.getAliasedSymbol(symbol).name;
    }
    return symbol.name;
  }
}
