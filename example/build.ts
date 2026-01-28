import { optimizer } from "../src";
import typescript from "@rollup/plugin-typescript";
import { rollup } from "rollup";
import { build } from "esbuild";

const main = async () => {
  await using bundle = await rollup({
    input: "./src/index.ts",
    plugins: [
      typescript({
        compilerOptions: {
          useDefineForClassFields: false,
          allowSyntheticDefaultImports: true,
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "Bundler",
          moduleDetection: "force",
          lib: ["DOM", "ESNext"],
        },
        transformers: (program) => ({
          before: [
            optimizer(program, {
              entrySourceFiles: ["./src/index.ts"],
              inlineConstEnums: true,
            }),
          ],
        }),
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
