import { expect, describe, it } from "bun:test";
import { compileTestInput } from "./compile_test_input";

describe("class props", () => {
  it.concurrent("public, private, internal", async () => {
    const result = await compileTestInput("./data/class-props/class-props.ts");
    const code = result?.output?.[0]?.code;
    // veryPublicAPI is public
    expect(code).not.toContain("$veryPublicAPI");
    expect(code).toContain("veryPublicAPI");
    expect(code).toContain("$i$apiMethod");
    expect(code).toContain("$i$internalHelper");
    expect(code).toContain("$p$secret");
  });

  it.concurrent("ignore decorated", async () => {
    const result = await compileTestInput("./data/class-props/decorated-props.ts", { ignoreDecorated: true });
    const code = result?.output?.[0]?.code;
    console.info(code);
    expect(code).not.toContain("$reasonable_name");
  });

  it.concurrent("decorated", async () => {
    const result = await compileTestInput("./data/class-props/decorated-props.ts");
    const code = result?.output?.[0]?.code;
    console.info(code);
    expect(code).toContain("$reasonable_name");
  });
});
