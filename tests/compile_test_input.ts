import { rollup } from "rollup";
import path from "node:path";
import typescript from "rollup-plugin-typescript2";
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
          clean: true,
          transformers: [
            // @ts-expect-error - rollup-plugin-typescript2 types not fully exported
            (ls) => ({
              before: [
                optimizer(ls.getProgram(), {
                  entrySourceFiles: [entryPoint],
                  inlineConstEnums: true,
                  ...(config || {}),
                }),
              ],
            }),
          ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
