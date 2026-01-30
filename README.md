[![NPM Version](https://img.shields.io/npm/v/%40eliasku%2Fts-transformers)](https://www.npmjs.com/package/@eliasku/ts-transformers)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/eliasku/ts-transformers/ci.yml)

# @eliasku/ts-transformers

TypeScript transformer for aggressive code minification through type-aware property renaming.

## Important Requirement

**You must compile ALL your code from TypeScript files.**

- No pre-transpiled `.js` files in source
- Transformer requires TypeScript type information
- Applicable for application builds, not libraries

## Core Concept

Two-phase optimization pipeline:

1. **This Transformer**: Analyzes TypeScript types, marks renamable properties with special prefixes
2. **Minifier (esbuild)**: Aggressively mangles prefixed properties while preserving public API

### Visibility Levels

Based on type analysis, properties are categorized as:

- **Public**: Exported from entry points → **no prefix** (preserved)
- **Private**: Everything else → prefixed with `$_` (mangled by minifier)

**Example:**

```typescript
// Before
class MyClass {
  /** @public - keeps name */
  publicApi() {}

  method() {}        // Private → $_method
  private secret = 1; // Private → $_secret
}

// After transformer (before minifier)
class MyClass {
  publicApi() {}
  $_method() {}
  $_secret = 1;
}

// After esbuild minifier
class A{publicApi(){},a(){},b=1}
```

### Const Enum Inlining

TypeScript currently inlines const enums, if you use traditional compiler for production build. Check if you have option `isolatedModules: false`  disabled in `tsconfig.json`.

## Usage

```typescript
import { optimizer } from "@eliasku/ts-transformers";
import typescript from "@rollup/plugin-typescript";
import { rollup } from "rollup";
import { build } from "esbuild";

// Phase 1: Type-aware optimization
const bundle = await rollup({
  input: "./src/index.ts",
  plugins: [
    typescript({
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["DOM", "ESNext"],
      },
      transformers: (program) => ({
        before: [
          optimizer(program, {
            entrySourceFiles: ["src/index.ts"],
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

// Phase 2: Aggressive minification
await build({
  entryPoints: ["./dist/bundle.js"],
  outfile: "./dist/bundle.min.js",
  minify: true,
  mangleProps: /^\$_/, // Match your privatePrefix
  mangleQuoted: false,
  keepNames: false,
});
```

**Note**: This plugin uses `@rollup/plugin-typescript`. The transformer receives a TypeScript `Program` object directly.

## Options

### entrySourceFiles (required)

Entry points defining your public API surface.

```typescript
entrySourceFiles: ["./src/index.ts"];
```

### privatePrefix (optional, default: "$\_")

Prefix for private properties that will be mangled by esbuild.

```typescript
privatePrefix: "$_"; // myFunction → $_myFunction
```

### publicJSDocTag (optional, default: "public")

JSDoc tag marking types/properties as public. Set to empty string to disable.

```typescript
publicJSDocTag: "public";

class MyClass {
  /** @public */
  apiMethod() {} // Public, no prefix

  internalHelper() {} // Private, gets $_ prefix
}
```

### ignoreDecorated (optional, default: false)

Skip renaming decorated fields.

```typescript
ignoreDecorated: true;

@Component({ selector: "app-root" })
class AppComponent {
  @Input() data: any; // Not renamed
  private internal = 1; // Renamed to $_internal
}
```

## Complete Example

```typescript
// src/index.ts (before)
class API {
  private baseUrl = "https://api.example.com";

  /** @public */
  async get(path: string): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  private async handleResponse(response: Response): Promise<Response> {
    return response;
  }
}

export const api = new API();

// After transformer
class API {
  $_baseUrl = "https://api.example.com";
  async get(path) {
    const url = `${this.$_baseUrl}${path}`;
    const response = await fetch(url);
    return this.$_handleResponse(response);
  }

  $_handleResponse(response) {
    return response;
  }
}

// After esbuild minifier
class A {
  a = "https://api.example.com";
  async get(t) {
    const n = `${this.a}${t}`;
    return await fetch(n);
  }
  b(t) {
    return t;
  }
}
const s = new A();
export { s };
```
