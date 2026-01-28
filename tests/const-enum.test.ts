import { expect, describe, it } from "bun:test";
import { compileTestInput } from "./compile_test_input";

describe("mangler with const-enum inlining", () => {
  it.concurrent("inline numeric const enum values", async () => {
    const result = await compileTestInput("./data/const-enum/numeric.ts");
    const code = result?.output?.[0]?.code;
    expect(code).toContain("0");
    expect(code).toContain("42");
    expect(code).toContain("-5");
    expect(code).not.toContain("NumericEnum");
  });

  it.concurrent("inline string const enum values", async () => {
    const result = await compileTestInput("./data/const-enum/string.ts");
    const code = result?.output?.[0]?.code;
    expect(code).toContain('"a"');
    expect(code).toContain('"b"');
    expect(code).not.toContain("StringEnum");
  });

  it.concurrent("inline complex expressions", async () => {
    const result = await compileTestInput("./data/const-enum/expressions.ts");
    const code = result?.output?.[0]?.code;

    // Bitwise
    expect(code).toContain("3"); // A | 2
    expect(code).toContain("1"); // A & 1

    // Arithmetic
    expect(code).toContain("6"); // A + 5
    expect(code).toContain("9"); // (A + 2) * 3

    // Unary
    expect(code).toContain("-1"); // -A
    expect(code).toContain("-2"); // ~A

    // Bit shift
    expect(code).toContain("3"); // D >> 1
    expect(code).toContain("24"); // D << 2

    expect(code).not.toContain("ExprEnum");
  });

  it.concurrent("inline imported const enum", async () => {
    const result = await compileTestInput("./data/const-enum/imports.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("1"); // ImportedEnum.Foo
    expect(code).not.toContain("ImportedEnum");
    // Import should be removed
    expect(code).not.toMatch(/import.*ImportedEnum/);
  });

  it.concurrent("remove local const enum declaration", async () => {
    const result = await compileTestInput("./data/const-enum/declarations.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("1"); // LocalEnum.A
    expect(code).not.toContain("LocalEnum");
    expect(code).not.toMatch(/const enum LocalEnum/);
  });

  it.concurrent("handle edge cases", async () => {
    const result = await compileTestInput("./data/const-enum/edge-cases.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("2"); // Implicit B
    expect(code).toContain("3"); // C = B + 1
    expect(code).toContain('"foobar"'); // E = D + "bar"
    expect(code).not.toContain("EdgeEnum");
  });
});
