import { expect, describe, it } from "bun:test";
import { compileTestInput } from "./compile_test_input";

describe("mangler transformer", () => {
  // These tests run in parallel with each other
  it.concurrent("issue1", async () => {
    const result = await compileTestInput("./data/issue1.ts");
    const code = result?.output?.[0]?.code;
    console.info(code);
    expect(code).toBe("const e = { $i$x: 1};\nconsole.info(e.$i$x);\n");
  });

  it.concurrent("re-export", async () => {
    const result = await compileTestInput("./data/reexport/re_export_main.ts");
    const code = result?.output?.[0]?.code;
    console.info(code);
    expect(code).toBe(`const func1_4$1 = () => "func1_4";

const func1_4 = () => "func1_4_b";

console.info(func1_4$1());
console.info(func1_4());
`);
  });

  it.concurrent("import-export", async () => {
    const result = await compileTestInput("./data/reexport/import_export_main.ts");
    const code = result?.output?.[0]?.code;
    console.info(code);
    expect(code).toBe(`const func1_2$1 = () => "func1_2";

const func1_2 = () => "func1_2_b";

console.info(func1_2$1());
console.info(func1_2());
`);
  });
});
