import { optimizer } from "../src";
import typescript from "rollup-plugin-typescript2";
import { rollup } from "rollup";
import { build } from "esbuild";

const main = async () => {
  await using bundle = await rollup({
    input: "./src/index.ts",
    plugins: [
      typescript({
        tsconfigDefaults: {
          useDefineForClassFields: false,
          allowSyntheticDefaultImports: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
          moduleDetection: "force",
          lib: ["DOM", "ESNext"],
        },
        clean: true,
        transformers: [
          // @ts-expect-error - rollup-plugin-typescript2 types not fully exported
          (ls) => ({
            before: [
              optimizer(ls.getProgram(), {
                entrySourceFiles: ["./src/index.ts"],
                inlineConstEnums: true,
              }),
            ],
          }),
        ] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      }),
    ],
  });

  await bundle.write({
    file: "./dist/bundle.js",
    format: "es",
  });

  // Phase 2: Aggressive minification with esbuild
  await build({
    target: "esnext",
    platform: "browser",
    entryPoints: ["./dist/bundle.js"],
    outfile: "./dist/bundle.min.js",
    minify: true,
    mangleProps: /^\$_/, // Match your privatePrefix
    mangleQuoted: false,
    keepNames: false,
  });
};

main();
