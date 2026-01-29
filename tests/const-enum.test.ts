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
    console.warn(code);
    expect(code).toContain("1"); // ImportedEnum.Foo
    expect(code).not.toContain("ImportedEnum");
    // Import should be removed
    expect(code).not.toMatch(/import.*ImportedEnum/);
  });

  it.concurrent("inline re-exported const enum", async () => {
    const result = await compileTestInput("./data/const-enum/re-export.ts");
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

  it.concurrent("remove import with only const enum", async () => {
    const result = await compileTestInput("./data/const-enum/issue-only-const-enum-import.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("1"); // OnlyConstEnum.A
    expect(code).not.toContain("OnlyConstEnum");
    // Import should be removed
    expect(code).not.toMatch(/import.*OnlyConstEnum/);
  });

  it.concurrent("keep value import when mixed with const enum", async () => {
    const result = await compileTestInput("./data/const-enum/issue-mixed-import.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("3"); // MixedEnum.A
    expect(code).not.toContain("MixedEnum");
    expect(code).toContain("value"); // regularValue
    // Const enum import should be removed
    expect(code).not.toMatch(/import.*MixedEnum/);
  });

  it.concurrent("remove entire import when all items are const enums", async () => {
    const result = await compileTestInput("./data/const-enum/issue-multiple-const-enums.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("10"); // Enum1.X
    expect(code).toContain("20"); // Enum2.Y
    expect(code).toContain("30"); // Enum3.Z
    expect(code).not.toContain("Enum1");
    expect(code).not.toContain("Enum2");
    expect(code).not.toContain("Enum3");
    // Import should be removed
    expect(code).not.toMatch(/import.*Enum[123]/);
  });

  it.concurrent("handle type-only import with const enum", async () => {
    const result = await compileTestInput("./data/const-enum/issue-type-only-import.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("5"); // TypeOnlyEnum.E
    expect(code).not.toContain("TypeOnlyEnum");
    // Both const enum and type-only import should be removed by rollup
    expect(code).not.toMatch(/import.*TypeOnlyEnum/);
    expect(code).not.toMatch(/import.*type SomeType/);
  });

  it.concurrent("remove re-export of const enum", async () => {
    const result = await compileTestInput("./data/const-enum/issue-re-export.ts");
    const code = result?.output?.[0]?.code;

    // Re-export should be removed
    expect(code).not.toContain("ReExportedEnum");
    expect(code).not.toMatch(/export.*ReExportedEnum/);
  });

  it.concurrent("inline const enum imported from re-export", async () => {
    const result = await compileTestInput("./data/const-enum/issue-import-re-export.ts");
    const code = result?.output?.[0]?.code;

    expect(code).toContain("100"); // ReExportedEnum.C
    expect(code).not.toContain("ReExportedEnum");
    // Import should be removed
    expect(code).not.toMatch(/import.*ReExportedEnum/);
  });
});
