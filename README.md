# @eliasku/ts-transformers

TypeScript transformer for code optimization.

## Usage

```typescript
import { optimizer } from "@eliasku/ts-transformers";

transformers: (program) => ({
  before: [
    optimizer(program, {
      entrySourceFiles: ["./src/index.ts"],
      inlineConstEnums: true,
    }),
  ],
});
```

## Options

### entrySourceFiles (required)

An array of entry source files which will be used to detect exported and internal fields. Basically it should be entry point(s) of the library/project.

### inlineConstEnums (optional, default: true)

Whether to inline const enum values and remove const enum declarations.

### privatePrefix (optional, default: "$p$")

Prefix of generated names for private fields.

### internalPrefix (optional, default: "$i$")

Prefix of generated names for internal fields.

### publicJSDocTag (optional, default: "public")

Comment which will treat a class/interface/type/property/etc and all its children as "public". Set it to empty string to disable using JSDoc comment to detect "visibility level".

### ignoreDecorated (optional, default: false)

Whether fields that were decorated should be renamed. A field is treated as "decorated" if itself or any its parent (on type level) has a decorator.
