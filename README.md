# @eliasku/ts-transformers

TypeScript transformer for aggressive code minification through type-aware property renaming and const enum inlining.

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

- **Public (External)**: Exported from entry points → **no prefix** (preserved)
- **Private**: Everything else → prefixed with `$p$` (mangled by minifier)

**Example:**
```typescript
// Before
class MyClass {
  /** @public - keeps name */
  publicApi() {}

  method() {}        // Private → $p$method
  private secret = 1; // Private → $p$secret
}

// After transformer (before minifier)
class MyClass {
  publicApi() {}
  $p$method() {}
  $p$secret = 1;
}

// After esbuild minifier
class A{publicApi(){},a(){},b=1}
```

### Const Enum Inlining

Replaces const enum accesses with literal values and removes declarations.

```typescript
// Before
const enum Status { Active = 1, Inactive = 0 }
const status = Status.Active;

// After transformer + minifier
const status = 1;
```

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

// Phase 2: Aggressive minification
await build({
  entryPoints: ["./dist/bundle.js"],
  outfile: "./dist/bundle.min.js",
  minify: true,
  mangleProps: /^\$p\$/,  // Match your privatePrefix
  mangleQuoted: false,
  keepNames: false,
});
```

## Options

### entrySourceFiles (required)

Entry points defining your public API surface.

```typescript
entrySourceFiles: ["./src/index.ts"]
```

### privatePrefix (optional, default: "$p$")

Prefix for private properties that will be mangled by esbuild.

```typescript
privatePrefix: "$p$"  // myFunction → $p$myFunction
```

### publicJSDocTag (optional, default: "public")

JSDoc tag marking types/properties as public. Set to empty string to disable.

```typescript
publicJSDocTag: "public"

class MyClass {
  /** @public */
  apiMethod() {}  // Public, no prefix

  internalHelper() {}  // Private, gets $p$ prefix
}
```

### ignoreDecorated (optional, default: false)

Skip renaming decorated fields.

```typescript
ignoreDecorated: true

@Component({ selector: "app-root" })
class AppComponent {
  @Input() data: any;  // Not renamed
  private internal = 1;  // Renamed to $p$internal
}
```

### inlineConstEnums (optional, default: true)

Inline const enum values and remove declarations.

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
  $p$baseUrl = "https://api.example.com";
  async get(path) {
    const url = `${this.$p$baseUrl}${path}`;
    const response = await fetch(url);
    return this.$p$handleResponse(response);
  }

  $p$handleResponse(response) {
    return response;
  }
}

// After esbuild minifier
class A{a="https://api.example.com";async get(t){const n=`${this.a}${t}`;return await fetch(n)}b(t){return t}}const s=new A;export{s};
```

## License

MIT
