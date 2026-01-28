import ts from "typescript";

export function getNodeJSDocComment(node: ts.Node): string {
  const start = node.getStart();
  const jsDocStart = node.getStart(undefined, true);
  return node.getSourceFile().getFullText().substring(jsDocStart, start).trim();
}
