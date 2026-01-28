# @eliasku/ts-transformers

TypeScript transformer for code optimization and preparation for aggressive minification.

## ⚠️ Important Requirement

**You must compile ALL your code from TypeScript files.**

- No pre-transpiled JavaScript files (`.js`) in your source code
- Transformer requires TypeScript type information to analyze visibility
- Any `.js` files will be included as-is without optimization
- Mix of `.ts` and `.js` sources → partial optimization, unexpected results

Applicable for only for application build, not libraries. For libraries it's better to use buildless approach, and provide `*.ts` files.

## Approach

This transformer prepares your code for aggressive minification by analyzing TypeScript types and applying two main optimizations:

### 1. Property Renaming with Detectable Prefixes

Based on type analysis, properties are categorized into three visibility levels:

- **External (Public)**: Exported from entry points → **no prefix** (preserved by minifiers)
- **Internal**: Used internally but not exported → prefixed with `$i$` (e.g., `$i$internalProperty`)
- **Private**: Private class members → prefixed with `$p$` (e.g., `$p$privateMethod`)

The special prefixes make these properties easily detectable by downstream minifiers (like **esbuild** or **terser**) for aggressive mangling, while preserving your public API surface.

**Example:**
```typescript
// Before
class MyClass {
  /** @public <- annotation in JSDoc to keep symbol name: property, method, field */
  publicApi() {} // `publicApi` is not renamed because it's marked by annotation
  
  public method() {}  // Internal → renamed to $i$method
  internalHelper() {}    // Internal → renamed to $i$internalHelper
  private secret = 1;    // Private → renamed to $p$secret
}

// After transformer (before minifier)
class MyClass {
  publicApi() {}
  $i$apiMethod() {}
  $i$internalHelper() {}
  $p$secret = 1;
}

// After esbuild minifier (aggressive property mangling)
class A{publicApi(){},a(){},b(){},c=1}
```

### 2. Const Enum Inlining

Const enums are compile-time constants that should never exist at runtime. This transformer:

- Replaces all const enum member accesses with their literal values
- Removes const enum declarations from output
- Strips `const` modifier from declarations in `.d.ts` files
- Removes unused const enum imports

**Example:**
```typescript
// Before
const enum Status {
  Active = 1,
  Inactive = 0
}

const status = Status.Active;  // Access

// After transformer (and minifier)
const status = 1;
// Status declaration removed, import removed
```

## Workflow

This transformer is **Phase 1** of a two-phase optimization pipeline:

### Phase 1: Type-Aware Preparation (This Transformer)
- **Input**: TypeScript source files
- **Process**: Analyze types, detect visibility, apply prefixes, inline const enums
- **Output**: ES modules with detectable prefixes
- **Tools**: `@eliasku/ts-transformers` + Rollup + TypeScript compiler

### Phase 2: Aggressive Minification (esbuild / terser)
- **Input**: ES modules from Phase 1
- **Process**: Detect prefixes, mangle aggressively, apply all minification techniques
- **Output**: Minified bundle with preserved public API
- **Tools**: esbuild with property mangling

**Why Two Phases?**
- TypeScript types are only available during compilation (Phase 1)
- Production minifiers (Phase 2) are faster and more sophisticated
- Prefixes bridge the gap: Phase 1 marks what's safe to mangle, Phase 2 performs the mangling

## Usage

### Basic Rollup Configuration

[Example Code](./example/build.ts)

```typescript
import { optimizer } from "@eliasku/ts-transformers";
import typescript from "@rollup/plugin-typescript";
import { rollup } from "rollup";

const build = async () => {
  await using bundle = await rollup({
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
};

build();
```

### Complete Build Pipeline (Transformer + esbuild)

```typescript
import { optimizer } from "@eliasku/ts-transformers";
import typescript from "@rollup/plugin-typescript";
import { rollup } from "rollup";
import { build } from "esbuild";

// Phase 1: Type-aware optimization with Rollup
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

// Phase 2: Aggressive minification with esbuild
await build({
  entryPoints: ["./dist/bundle.js"],
  outfile: "./dist/bundle.min.js",
  minify: true,
  mangleProps: /^(\$i\$|\$p\$)/,  // Match your custom prefixes here
  mangleQuoted: false,
  keepNames: false,
});
```

### Customizing esbuild to Match Your Prefixes

If you customize the prefix options, update esbuild config to match:

```typescript
optimizer(program, {
  entrySourceFiles: ["./src/index.ts"],
  internalPrefix: "_int_",   // Custom internal prefix
  privatePrefix: "_priv_",    // Custom private prefix
});

// Then in esbuild:
mangleProps: /^(_int_|_priv_)/,  // Match custom prefixes
```

## Options

### entrySourceFiles (required)

An array of entry source files used to detect exported and external fields. This determines your public API surface.

```typescript
entrySourceFiles: ["./src/index.ts"]
```

### internalPrefix (optional, default: "$i$")

Prefix for internal properties (not exported, but used across your codebase). These will be aggressively mangled by esbuild.

```typescript
internalPrefix: "$i$"  // default: myFunction → $i$myFunction
```

### privatePrefix (optional, default: "$p$")

Prefix for private class members. These will be aggressively mangled by esbuild.

```typescript
privatePrefix: "$p$"  // default: this.private → this.$p$private
```

### publicJSDocTag (optional, default: "public")

JSDoc tag that marks a class/interface/property and all its children as public/external. Set to empty string to disable.

```typescript
publicJSDocTag: "public"  // default

class MyClass {
  /** @public */
  apiMethod() {}  // Treated as external, no prefix applied

  internalHelper() {}  // Treated as internal, gets $i$ prefix
}
```

### ignoreDecorated (optional, default: false)

Whether decorated fields should be renamed. A field is "decorated" if itself or any parent (on type level) has a decorator.

```typescript
ignoreDecorated: true  // Don't rename decorated fields

@Component({
  selector: "app-root"
})
class AppComponent {
  @Input() data: any;  // Decorated → not renamed with ignoreDecorated: true
  private internal = 1;  // Still renamed to $p$internal
}
```

### inlineConstEnums (optional, default: true)

Whether to inline const enum values and remove const enum declarations.

```typescript
inlineConstEnums: true  // default: inline const enums
inlineConstEnums: false  // Keep const enum declarations
```

## Examples

### Example 1: Simple Property Renaming

```typescript
// src/index.ts (before)
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  logResult(value: number): void {
    console.log(value);
  }
}

export const calc = new Calculator();
export { Calculator };

// After transformer (before minifier)
class Calculator {
  add(a, b) { return a + b; }  // Exported method → no prefix
  $i$logResult(value) {            // Internal method → $i$ prefix
    console.log(value);
  }
}
```

### Example 2: JSDoc Public Annotation

```typescript
// src/index.ts (before)
class API {
  /** @public */
  fetchData(url: string): Promise<Data> {
    return fetch(url);
  }

  private cache = new Map();
  internalTransform(data: Data): Processed {
    // transformation logic
  }
}

export const api = new API();

// After transformer (before minifier)
class API {
  fetchData(url) { return fetch(url); }  // @public → no prefix
  $p$cache = new Map();                // Private → $p$ prefix
  $i$internalTransform(data) {          // Internal → $i$ prefix
    // transformation logic
  }
}
```

### Example 3: Const Enum Inlining

```typescript
// src/index.ts (before)
const enum LogLevel {
  Debug = 0,
  Info = 1,
  Error = 2
}

function log(level: LogLevel, message: string): void {
  console.log(`[${LogLevel[level]}] ${message}`);
}

export { log, LogLevel };

// After transformer (before minifier)
function log(level, message) {
  console.log(`[${level}] ${message}`);
}
export { log };

// After esbuild minifier
function log(n,e){console.log(`[${n}]${e}`)}export{log};
// LogLevel values inlined: LogLevel.Debug → 0, LogLevel.Info → 1, etc.
// LogLevel enum declaration removed entirely
```

### Example 4: Complete Transformation + Minification

```typescript
// src/index.ts (before)
const enum HttpStatus {
  OK = 200,
  NotFound = 404
}

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

  logStatus(status: HttpStatus): void {
    console.log(status);
  }
}

export const api = new API();

// After transformer (before minifier)
class API {
  $p$baseUrl = "https://api.example.com";
  async get(path) {
    const url = `${this.$p$baseUrl}${path}`;
    const response = await fetch(url);
    return this.$i$handleResponse(response);
  }

  $i$handleResponse(response) {
    return response;
  }

  $i$logStatus(status) {
    console.log(status);
  }
}

// After esbuild minifier
class t{a="https://api.example.com";async get(t){const n=`${this.a}${t}`;return await fetch(n)}b(t){return t}c(t){console.log(t)}}const s=new t;export{s};
```

## License

MIT
