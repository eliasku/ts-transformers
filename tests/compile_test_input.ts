import { rollup, RollupBuild, RollupOptions, RollupOutput } from "rollup";
import path from "node:path";
import typescript from "@rollup/plugin-typescript";
import { propertiesRenameTransformer } from "../src/mangler";
import { tsTransformConstEnums } from "../src/const-enum";

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
            tsTransformConstEnums(program, [entryPoint]),
            propertiesRenameTransformer(program, {
              entrySourceFiles: [entryPoint],
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
  let bundle: RollupBuild | undefined;
  let output: RollupOutput | undefined;
  let buildFailed = false;
  try {
    // Create a bundle. If you are using TypeScript or a runtime that
    // supports it, you can write
    //
    // await using bundle = await rollup(inputOptions);
    //
    // instead and do not need to close the bundle explicitly below.
    bundle = await rollup(inputOptions);
    // console.info("count rollup logs:", logs.length);

    output = await bundle.generate({
      format: "es",
      minifyInternalExports: true,
    });
  } catch (error) {
    buildFailed = true;
    // do some error reporting
    console.error(error);
    throw error;
  }
  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
  return output;
};
