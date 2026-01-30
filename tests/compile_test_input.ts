import { rollup } from "rollup";
import path from "node:path";
import typescript from "@rollup/plugin-typescript";
import { optimizer, type OptimizerOptions } from "../src";

export const compileTestInput = async (input: string, config?: Partial<OptimizerOptions>) => {
  const entryPoint = path.resolve(__dirname, input);
  const tsConfigPath = path.resolve(__dirname, "./data/tsconfig.json");
  try {
    await using bundle = await rollup({
      input: entryPoint,
      plugins: [
        typescript({
          tsconfig: tsConfigPath,
          transformers: (program) => ({
            before: [
              optimizer(program, {
                entrySourceFiles: [entryPoint],
                ...(config || {}),
              }),
            ],
          }),
        }),
      ],
      logLevel: "debug",
      onLog: (log) => {
        console.warn(log);
      },
    });
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
