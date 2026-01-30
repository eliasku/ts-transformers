import { expect, describe, it } from "bun:test";
import { compileTestInput } from "./compile_test_input";

describe("class props", () => {
  it.concurrent("public and private", async () => {
    const result = await compileTestInput("./data/class-props/class-props.ts");
    const code = result?.output?.[0]?.code;
    // veryPublicAPI is public
    expect(code).not.toContain("$_veryPublicAPI");
    expect(code).toContain(".veryPublicAPI");
    expect(code).toContain("$_apiMethod");
    expect(code).toContain("$_internalHelper");
    expect(code).toContain("$_secret");
  });

  it.concurrent("ignore decorated", async () => {
    const result = await compileTestInput("./data/class-props/decorated-props.ts", { ignoreDecorated: true });
    const code = result?.output?.[0]?.code;
    // console.info(code);
    expect(code).toContain(".reasonable_name");
  });

  it.concurrent("decorated", async () => {
    const result = await compileTestInput("./data/class-props/decorated-props.ts");
    const code = result?.output?.[0]?.code;
    // console.info(code);
    expect(code).toContain("$_reasonable_name");
  });
});
