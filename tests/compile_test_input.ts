import { rollup, RollupOptions } from "rollup";
import path from "node:path";
import typescript from "@rollup/plugin-typescript";
import { optimizer } from "../src";

export const compileTestInput = async (input: string) => {
  const entryPoint = path.resolve(__dirname, input);
  const tsConfigPath = path.resolve(__dirname, "./data/tsconfig.json");
  const inputOptions: RollupOptions = {
    input: entryPoint,
    plugins: [
      typescript({
        tsconfig: tsConfigPath,
        exclude: [],
        transformers: (program) => ({
          before: [
            optimizer(program, {
              entrySourceFiles: [entryPoint],
              inlineConstEnums: true,
            }),
          ],
        }),
      }),
    ],
    logLevel: "debug",
    onLog: (log) => {
      console.warn(log);
    },
  };
  try {
    await using bundle = await rollup(inputOptions);
    return await bundle.generate({
      format: "es",
      minifyInternalExports: true,
    });
  } catch (error) {
    // do some error reporting
    console.error(error);
    throw error;
  }
};
